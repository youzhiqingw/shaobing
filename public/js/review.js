/**
 * 🔥 烧饼小摊 - 顾客评价功能
 */

// 当前选择的评价类型
let currentReviewType = null;

/**
 * 初始化评价系统
 */
async function initReviewSystem() {
  // 检查是否在首页
  const reviewList = document.getElementById('reviewList');
  if (!reviewList) return;
  
  // 加载评价数据
  await loadReviews();
  
  // 绑定评价按钮事件
  bindReviewButtons();
}

/**
 * 加载评价数据
 */
async function loadReviews() {
  try {
    const data = await getReviews(10);
    renderReviews(data);
    updateReviewStats(data);
  } catch (error) {
    console.error('加载评价失败:', error);
    // 使用空数据渲染
    renderReviews([]);
    updateReviewStats([]);
  }
}

/**
 * 渲染评价列表
 */
function renderReviews(reviews) {
  const reviewList = document.getElementById('reviewList');
  if (!reviewList) return;
  
  if (!reviews || reviews.length === 0) {
    reviewList.innerHTML = `
      <div class="review-item">
        <p class="review-item-content" style="text-align: center; color: #999;">
          暂无评价，快来成为第一个评价的人吧～
        </p>
      </div>
    `;
    return;
  }
  
  // 只显示前 10 条
  const displayReviews = reviews.slice(0, 10);
  
  reviewList.innerHTML = displayReviews.map(review => {
    const typeClass = review.type === 'good' ? 'good' : 'bad';
    const typeText = review.type === 'good' ? '👍 好吃' : '👎 不好吃';
    const content = review.content || '用户未填写具体评价';
    const date = formatTimeDisplay(review.createdAt);
    
    return `
      <div class="review-item">
        <div class="review-item-header">
          <span class="review-item-type ${typeClass}">${typeText}</span>
          <span class="review-item-date">${date}</span>
        </div>
        <p class="review-item-content">${escapeHtml(content)}</p>
      </div>
    `;
  }).join('');
}

/**
 * 更新评价统计
 */
function updateReviewStats(reviews) {
  if (!reviews) return;
  
  const goodCount = reviews.filter(r => r.type === 'good').length;
  const badCount = reviews.filter(r => r.type === 'bad').length;
  const totalCount = goodCount + badCount;
  
  const goodPercent = totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0;
  const badPercent = totalCount > 0 ? Math.round((badCount / totalCount) * 100) : 0;
  
  // 更新显示
  const goodCountEl = document.getElementById('goodCount');
  const badCountEl = document.getElementById('badCount');
  const goodPercentEl = document.getElementById('goodPercent');
  const badPercentEl = document.getElementById('badPercent');
  
  if (goodCountEl) goodCountEl.textContent = goodCount;
  if (badCountEl) badCountEl.textContent = badCount;
  if (goodPercentEl) goodPercentEl.textContent = `${goodPercent}%`;
  if (badPercentEl) badPercentEl.textContent = `${badPercent}%`;
}

/**
 * 绑定评价按钮事件
 */
function bindReviewButtons() {
  const btnGood = document.getElementById('btnGood');
  const btnBad = document.getElementById('btnBad');
  const reviewFormWrapper = document.getElementById('reviewFormWrapper');
  const reviewInput = document.getElementById('reviewInput');
  const reviewSubmit = document.getElementById('reviewSubmit');
  const reviewCancel = document.getElementById('reviewCancel');
  
  if (btnGood) {
    btnGood.addEventListener('click', () => {
      currentReviewType = 'good';
      showReviewForm();
    });
  }
  
  if (btnBad) {
    btnBad.addEventListener('click', () => {
      currentReviewType = 'bad';
      showReviewForm();
    });
  }
  
  if (reviewCancel) {
    reviewCancel.addEventListener('click', () => {
      hideReviewForm();
    });
  }
  
  if (reviewSubmit) {
    reviewSubmit.addEventListener('click', () => {
      submitReviewHandler();
    });
  }
}

/**
 * 显示评价表单
 */
function showReviewForm() {
  const reviewFormWrapper = document.getElementById('reviewFormWrapper');
  const reviewInput = document.getElementById('reviewInput');
  
  if (reviewFormWrapper) {
    reviewFormWrapper.classList.add('show');
  }
  
  if (reviewInput) {
    reviewInput.focus();
  }
}

/**
 * 隐藏评价表单
 */
function hideReviewForm() {
  const reviewFormWrapper = document.getElementById('reviewFormWrapper');
  const reviewInput = document.getElementById('reviewInput');
  
  if (reviewFormWrapper) {
    reviewFormWrapper.classList.remove('show');
  }
  
  if (reviewInput) {
    reviewInput.value = '';
  }
  
  currentReviewType = null;
}

/**
 * 提交评价处理
 */
async function submitReviewHandler() {
  const reviewInput = document.getElementById('reviewInput');
  const content = reviewInput ? reviewInput.value.trim() : '';
  
  if (!currentReviewType) {
    showToast('请选择评价类型');
    return;
  }
  
  // 验证内容长度
  if (content && content.length > 100) {
    showToast('评价内容最多 100 字');
    return;
  }
  
  try {
    // 禁用提交按钮防止重复提交
    const submitBtn = document.getElementById('reviewSubmit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';
    }
    
    await submitReview(currentReviewType, content);
    
    showToast('评价提交成功！');
    hideReviewForm();
    
    // 重新加载评价
    await loadReviews();
    
  } catch (error) {
    console.error('提交评价失败:', error);
    
    // 检查是否是速率限制
    if (error.message && error.message.includes('速率限制')) {
      showToast('您已评价过，请稍后再来');
    } else {
      showToast('提交失败，请重试');
    }
  } finally {
    // 恢复提交按钮
    const submitBtn = document.getElementById('reviewSubmit');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '提交';
    }
  }
}

/**
 * HTML 转义，防止 XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 检查是否已评价（本地缓存检查）
 */
function hasReviewed() {
  const lastReviewTime = localStorage.getItem('lastReviewTime');
  if (!lastReviewTime) return false;
  
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  return now - parseInt(lastReviewTime) < oneHour;
}

/**
 * 标记已评价
 */
function markReviewed() {
  localStorage.setItem('lastReviewTime', Date.now().toString());
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  initReviewSystem();
});
