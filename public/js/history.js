/**
 * 🔥 烧饼小摊 - 历史记录功能
 */

// 分页参数
let currentOffset = 0;
const limit = 30;
let hasMore = true;
let isLoading = false;

// 弹窗实例
let historyModal = null;

/**
 * 初始化历史记录页面
 */
async function initHistoryPage() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;
  
  // 初始化弹窗
  historyModal = new Modal('historyModal');
  
  // 设置日期输入的最大值为今天
  const searchDate = document.getElementById('searchDate');
  if (searchDate) {
    const today = new Date().toISOString().split('T')[0];
    searchDate.max = today;
  }
  
  // 绑定搜索事件
  bindSearchEvents();
  
  // 绑定加载更多事件
  bindLoadMoreEvents();
  
  // 加载初始数据
  await loadHistoryList();
}

/**
 * 加载历史记录列表
 */
async function loadHistoryList(isRefresh = false) {
  if (isLoading) return;
  
  if (isRefresh) {
    currentOffset = 0;
    hasMore = true;
  }
  
  if (!hasMore) return;
  
  isLoading = true;
  
  try {
    const data = await getHistoryList(limit, currentOffset);
    
    if (isRefresh) {
      renderHistoryList(data);
    } else {
      appendHistoryList(data);
    }
    
    // 判断是否还有更多数据
    hasMore = data.length === limit;
    currentOffset += data.length;
    
    updateLoadMoreButton();
    
  } catch (error) {
    console.error('加载历史记录失败:', error);
    showToast('加载失败，请重试');
  } finally {
    isLoading = false;
  }
}

/**
 * 渲染历史记录列表
 */
function renderHistoryList(historyList) {
  const container = document.getElementById('historyList');
  if (!container) return;
  
  if (!historyList || historyList.length === 0) {
    container.innerHTML = `
      <div class="history-item" style="text-align: center; color: #999;">
        <p>暂无历史记录</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = historyList.map(item => createHistoryItemHTML(item)).join('');
  
  // 绑定点击事件
  bindHistoryItemClick();
}

/**
 * 追加历史记录列表
 */
function appendHistoryList(historyList) {
  const container = document.getElementById('historyList');
  if (!container) return;
  
  // 移除"暂无数据"提示
  if (container.querySelector('.history-item')) {
    const firstItem = container.querySelector('.history-item');
    if (firstItem.textContent.includes('暂无历史记录')) {
      container.innerHTML = '';
    }
  }
  
  const html = historyList.map(item => createHistoryItemHTML(item)).join('');
  container.insertAdjacentHTML('beforeend', html);
  
  // 绑定点击事件
  bindHistoryItemClick();
}

/**
 * 创建历史记录项 HTML
 */
function createHistoryItemHTML(item) {
  const statusClass = getStatusClass(item.status);
  const statusText = getStatusText(item.status);
  const location = item.location || '-';
  const time = item.time || '-';
  const note = item.note || '无备注';
  
  return `
    <div class="history-item" data-date="${item.date}">
      <div class="history-item-header">
        <span class="history-item-date">${item.date}</span>
        <span class="history-item-status ${statusClass}">${statusText}</span>
      </div>
      <div class="history-item-body">
        <span>📍 ${escapeHtml(location)}</span>
        <span>⏰ ${escapeHtml(time)}</span>
        ${note !== '无备注' ? `<span>📝 ${escapeHtml(note)}</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * 绑定历史记录项点击事件
 */
function bindHistoryItemClick() {
  const items = document.querySelectorAll('.history-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const date = item.dataset.date;
      showHistoryDetail(date);
    });
  });
}

/**
 * 显示历史记录详情
 */
async function showHistoryDetail(date) {
  try {
    const data = await getHistoryByDate(date);
    
    // 填充详情
    document.getElementById('detailDate').textContent = data.date || date;
    document.getElementById('detailStatus').textContent = getStatusText(data.status);
    document.getElementById('detailLocation').textContent = data.location || '-';
    document.getElementById('detailTime').textContent = data.time || '-';
    document.getElementById('detailNote').textContent = data.note || '无备注';
    
    // 显示弹窗
    historyModal.show();
    
  } catch (error) {
    console.error('获取历史详情失败:', error);
    showToast('获取详情失败，请重试');
  }
}

/**
 * 绑定搜索事件
 */
function bindSearchEvents() {
  const searchBtn = document.getElementById('searchBtn');
  const searchDate = document.getElementById('searchDate');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const date = searchDate.value;
      if (date) {
        searchByDate(date);
      }
    });
  }
  
  if (searchDate) {
    searchDate.addEventListener('change', () => {
      const date = searchDate.value;
      if (date) {
        searchByDate(date);
      }
    });
    
    searchDate.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const date = searchDate.value;
        if (date) {
          searchByDate(date);
        }
      }
    });
  }
}

/**
 * 按日期搜索
 */
async function searchByDate(date) {
  try {
    const data = await getHistoryByDate(date);
    
    if (data) {
      // 显示单条结果
      renderHistoryList([data]);
      hasMore = false;
      updateLoadMoreButton();
    } else {
      renderHistoryList([]);
      showToast('未找到该日期的记录');
    }
    
  } catch (error) {
    console.error('搜索失败:', error);
    showToast('搜索失败，请重试');
  }
}

/**
 * 绑定加载更多事件
 */
function bindLoadMoreEvents() {
  const loadMoreBtn = document.querySelector('.load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadHistoryList(false);
    });
  }
}

/**
 * 更新加载更多按钮状态
 */
function updateLoadMoreButton() {
  const loadMore = document.getElementById('loadMore');
  const loadMoreBtn = document.querySelector('.load-more-btn');
  
  if (!loadMore || !loadMoreBtn) return;
  
  if (!hasMore) {
    loadMoreBtn.textContent = '没有更多了';
    loadMoreBtn.disabled = true;
    loadMoreBtn.style.opacity = '0.5';
    loadMoreBtn.style.cursor = 'not-allowed';
  } else {
    loadMoreBtn.textContent = '加载更多';
    loadMoreBtn.disabled = false;
    loadMoreBtn.style.opacity = '1';
    loadMoreBtn.style.cursor = 'pointer';
  }
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  initHistoryPage();
});
