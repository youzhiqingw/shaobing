/**
 * 🔥 烧饼小摊 - 管理后台功能
 */

// 弹窗实例
let editHistoryModal = null;
let currentEditDate = null;

/**
 * 初始化管理后台
 */
async function initAdminPage() {
  // 检查登录状态
  if (!isLoggedIn()) {
    showLoginPrompt();
    return;
  }
  
  // 显示管理内容
  document.getElementById('loginPrompt').style.display = 'none';
  document.getElementById('adminContent').style.display = 'block';
  
  // 初始化弹窗
  editHistoryModal = new Modal('editHistoryModal');
  
  // 绑定选项卡事件
  bindTabs();
  
  // 加载今日状态
  await loadTodayStatus();
  
  // 绑定今日状态表单
  bindTodayForm();
  
  // 加载历史记录
  await loadHistoryForAdmin();
  
  // 加载评价列表
  await loadReviewsForAdmin();
  
  // 绑定导出按钮
  bindExportButton();
}

/**
 * 显示登录提示
 */
function showLoginPrompt() {
  const prompt = document.getElementById('loginPrompt');
  const content = document.getElementById('adminContent');
  
  if (prompt) prompt.style.display = 'block';
  if (content) content.style.display = 'none';
}

/**
 * 绑定选项卡事件
 */
function bindTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // 切换按钮状态
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // 切换面板显示
      panels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `panel-${tabId}`) {
          panel.classList.add('active');
        }
      });
      
      // 加载对应数据
      switch (tabId) {
        case 'today':
          loadTodayStatus();
          break;
        case 'history':
          loadHistoryForAdmin();
          break;
        case 'reviews':
          loadReviewsForAdmin();
          break;
      }
    });
  });
}

/**
 * 加载今日状态
 */
async function loadTodayStatus() {
  try {
    const data = await getTodayStatus();
    fillTodayForm(data);
  } catch (error) {
    console.error('加载今日状态失败:', error);
    showToast('加载失败，请重试');
  }
}

/**
 * 填充今日状态表单
 */
function fillTodayForm(data) {
  if (!data) return;
  
  // 设置状态单选
  const statusRadios = document.querySelectorAll('input[name="status"]');
  statusRadios.forEach(radio => {
    radio.checked = radio.value === data.status;
  });
  
  // 设置其他字段
  const locationInput = document.getElementById('todayLocation');
  const timeInput = document.getElementById('todayTime');
  const noteInput = document.getElementById('todayNote');
  
  if (locationInput) locationInput.value = data.location || '';
  if (timeInput) timeInput.value = data.time || '';
  if (noteInput) noteInput.value = data.note || '';
}

/**
 * 绑定今日状态表单
 */
function bindTodayForm() {
  const form = document.getElementById('todayForm');
  const cancelBtn = document.getElementById('todayCancel');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveTodayStatus();
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      loadTodayStatus();
    });
  }
}

/**
 * 保存今日状态
 */
async function saveTodayStatus() {
  const statusRadios = document.querySelectorAll('input[name="status"]:checked');
  const locationInput = document.getElementById('todayLocation');
  const timeInput = document.getElementById('todayTime');
  const noteInput = document.getElementById('todayNote');
  
  if (statusRadios.length === 0) {
    showToast('请选择出摊状态');
    return;
  }
  
  const statusData = {
    status: statusRadios[0].value,
    location: locationInput.value.trim(),
    time: timeInput.value.trim(),
    note: noteInput.value.trim()
  };
  
  // 验证必填项
  if (!statusData.location) {
    showToast('请填写出摊位置');
    locationInput.focus();
    return;
  }
  
  if (!statusData.time) {
    showToast('请填写出摊时间');
    timeInput.focus();
    return;
  }
  
  try {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '保存中...';
    }
    
    await updateTodayStatus(statusData);
    
    showToast('保存成功！');
    
  } catch (error) {
    console.error('保存失败:', error);
    showToast('保存失败，请重试');
  } finally {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '保存';
    }
  }
}

/**
 * 加载历史记录（管理后台）
 */
async function loadHistoryForAdmin() {
  try {
    const data = await getHistoryList(90, 0);
    renderHistoryTable(data);
    bindHistorySearch();
  } catch (error) {
    console.error('加载历史记录失败:', error);
  }
}

/**
 * 渲染历史记录表格
 */
function renderHistoryTable(historyList) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;
  
  if (!historyList || historyList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: #999; padding: 20px;">
          暂无历史记录
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = historyList.map(item => {
    const statusClass = getStatusClass(item.status);
    const statusText = getStatusText(item.status);
    
    return `
      <tr data-date="${item.date}">
        <td>${item.date}</td>
        <td><span class="history-item-status ${statusClass}">${statusText}</span></td>
        <td>${escapeHtml(item.location || '-')}</td>
        <td>
          <button class="action-btn action-btn-view" onclick="viewHistory('${item.date}')">查看</button>
          <button class="action-btn action-btn-edit" onclick="editHistory('${item.date}')">编辑</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 绑定历史记录搜索
 */
function bindHistorySearch() {
  const searchBtn = document.getElementById('historySearchBtn');
  const searchDate = document.getElementById('historySearchDate');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', searchHistoryByDate);
  }
  
  if (searchDate) {
    searchDate.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchHistoryByDate();
      }
    });
  }
}

/**
 * 搜索历史记录按日期
 */
async function searchHistoryByDate() {
  const searchDate = document.getElementById('historySearchDate');
  const date = searchDate.value;
  
  if (!date) {
    showToast('请选择日期');
    return;
  }
  
  try {
    const data = await getHistoryByDate(date);
    if (data) {
      renderHistoryTable([data]);
    } else {
      renderHistoryTable([]);
      showToast('未找到该日期的记录');
    }
  } catch (error) {
    console.error('搜索失败:', error);
    showToast('搜索失败，请重试');
  }
}

/**
 * 查看历史记录详情
 */
async function viewHistory(date) {
  try {
    const data = await getHistoryByDate(date);
    
    // 填充编辑表单
    currentEditDate = date;
    fillEditHistoryForm(data);
    
    // 显示弹窗
    editHistoryModal.show();
    
    // 禁用保存按钮（查看模式）
    const saveBtn = document.getElementById('editHistorySave');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.style.opacity = '0.5';
    }
    
  } catch (error) {
    console.error('获取详情失败:', error);
    showToast('获取详情失败，请重试');
  }
}

/**
 * 编辑历史记录
 */
async function editHistory(date) {
  try {
    const data = await getHistoryByDate(date);
    
    // 填充编辑表单
    currentEditDate = date;
    fillEditHistoryForm(data);
    
    // 显示弹窗
    editHistoryModal.show();
    
    // 启用保存按钮
    const saveBtn = document.getElementById('editHistorySave');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.style.opacity = '1';
    }
    
  } catch (error) {
    console.error('获取详情失败:', error);
    showToast('获取详情失败，请重试');
  }
}

/**
 * 填充编辑历史记录表单
 */
function fillEditHistoryForm(data) {
  if (!data) return;
  
  // 设置日期
  document.getElementById('editHistoryDate').value = data.date || currentEditDate;
  
  // 设置状态单选
  const statusRadios = document.querySelectorAll('input[name="editStatus"]');
  statusRadios.forEach(radio => {
    radio.checked = radio.value === data.status;
  });
  
  // 设置其他字段
  const locationInput = document.getElementById('editHistoryLocation');
  const timeInput = document.getElementById('editHistoryTime');
  const noteInput = document.getElementById('editHistoryNote');
  
  if (locationInput) locationInput.value = data.location || '';
  if (timeInput) timeInput.value = data.time || '';
  if (noteInput) noteInput.value = data.note || '';
}

/**
 * 绑定编辑历史记录表单
 */
function bindEditHistoryForm() {
  const saveBtn = document.getElementById('editHistorySave');
  const cancelBtn = document.getElementById('editHistoryCancel');
  const closeBtn = document.getElementById('editHistoryModalClose');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', saveEditHistory);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editHistoryModal.hide();
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      editHistoryModal.hide();
    });
  }
}

/**
 * 保存编辑的历史记录
 */
async function saveEditHistory() {
  if (!currentEditDate) {
    showToast('缺少日期信息');
    return;
  }
  
  const statusRadios = document.querySelectorAll('input[name="editStatus"]:checked');
  const locationInput = document.getElementById('editHistoryLocation');
  const timeInput = document.getElementById('editHistoryTime');
  const noteInput = document.getElementById('editHistoryNote');
  
  if (statusRadios.length === 0) {
    showToast('请选择出摊状态');
    return;
  }
  
  const statusData = {
    status: statusRadios[0].value,
    location: locationInput.value.trim(),
    time: timeInput.value.trim(),
    note: noteInput.value.trim()
  };
  
  try {
    await updateHistory(currentEditDate, statusData);
    
    showToast('保存成功！');
    editHistoryModal.hide();
    
    // 重新加载历史记录列表
    await loadHistoryForAdmin();
    
  } catch (error) {
    console.error('保存失败:', error);
    showToast('保存失败，请重试');
  }
}

/**
 * 加载评价列表（管理后台）
 */
async function loadReviewsForAdmin() {
  try {
    const data = await getReviews(500);
    renderReviewsTable(data);
  } catch (error) {
    console.error('加载评价失败:', error);
  }
}

/**
 * 渲染评价表格
 */
function renderReviewsTable(reviews) {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;
  
  if (!reviews || reviews.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #999; padding: 20px;">
          暂无评价
        </td>
      </tr>
    `;
    return;
  }
  
  // 按时间倒序排列
  const sortedReviews = [...reviews].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  tbody.innerHTML = sortedReviews.map(item => {
    const typeIcon = item.type === 'good' ? '👍' : '👎';
    const typeClass = item.type === 'good' ? 'good' : 'bad';
    const date = formatDate(item.createdAt);
    const time = new Date(item.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    return `
      <tr data-id="${item.id}">
        <td><span class="review-item-type ${typeClass}">${typeIcon}</span></td>
        <td>${escapeHtml(item.content || '无内容')}</td>
        <td>${maskIP(item.ip)}</td>
        <td>${date} ${time}</td>
        <td>
          <button class="action-btn action-btn-delete" onclick="deleteReviewItem('${item.id}')">删除</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 删除评价
 */
async function deleteReviewItem(id) {
  if (!confirm('确定要删除这条评价吗？')) {
    return;
  }
  
  try {
    await deleteReview(id);
    showToast('删除成功');
    await loadReviewsForAdmin();
  } catch (error) {
    console.error('删除失败:', error);
    showToast('删除失败，请重试');
  }
}

/**
 * 绑定导出按钮
 */
function bindExportButton() {
  const exportBtn = document.getElementById('exportReviews');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportReviewsHandler);
  }
}

/**
 * 导出评价处理
 */
async function exportReviewsHandler() {
  try {
    const data = await exportReviews();
    
    // 创建下载
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('导出成功');
  } catch (error) {
    console.error('导出失败:', error);
    showToast('导出失败，请重试');
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

// 暴露全局函数
window.viewHistory = viewHistory;
window.editHistory = editHistory;
window.deleteReviewItem = deleteReviewItem;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  initAdminPage();
  bindEditHistoryForm();
});
