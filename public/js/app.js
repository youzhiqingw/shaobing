/**
 * 🔥 烧饼小摊 - 核心逻辑
 * 通用工具函数和 API 调用
 */

// API 基础路径
const API_BASE = '/api';

/**
 * 通用 API 请求函数
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  // 添加认证 token
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API 请求错误:', error);
    throw error;
  }
}

/**
 * 获取今日状态
 */
async function getTodayStatus() {
  return apiRequest('/status/today');
}

/**
 * 更新今日状态
 */
async function updateTodayStatus(statusData) {
  return apiRequest('/status/today', {
    method: 'PUT',
    body: JSON.stringify(statusData),
  });
}

/**
 * 获取历史记录列表
 */
async function getHistoryList(limit = 30, offset = 0) {
  return apiRequest(`/history?limit=${limit}&offset=${offset}`);
}

/**
 * 获取指定日期的历史记录
 */
async function getHistoryByDate(date) {
  return apiRequest(`/history/${date}`);
}

/**
 * 更新历史记录
 */
async function updateHistory(date, statusData) {
  return apiRequest(`/history/${date}`, {
    method: 'PUT',
    body: JSON.stringify(statusData),
  });
}

/**
 * 获取评价列表
 */
async function getReviews(limit = 10) {
  return apiRequest(`/reviews?limit=${limit}`);
}

/**
 * 提交评价
 */
async function submitReview(type, content = '') {
  return apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify({ type, content }),
  });
}

/**
 * 删除评价（管理员）
 */
async function deleteReview(id) {
  return apiRequest(`/reviews/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 导出评价（管理员）
 */
async function exportReviews() {
  return apiRequest('/reviews/export');
}

/**
 * 登录验证
 */
async function login(password) {
  return apiRequest('/auth', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

/**
 * 退出登录
 */
function logout() {
  localStorage.removeItem('isAdminLoggedIn');
  localStorage.removeItem('adminToken');
}

/**
 * 检查是否已登录
 */
function isLoggedIn() {
  return localStorage.getItem('isAdminLoggedIn') === 'true';
}

/**
 * Toast 提示
 */
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间显示
 */
function formatTimeDisplay(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return formatDate(dateStr);
  }
}

/**
 * 获取状态样式类
 */
function getStatusClass(status) {
  switch (status) {
    case '出摊中':
      return 'open';
    case '已收摊':
      return 'closed';
    case '休息':
      return 'rest';
    default:
      return 'closed';
  }
}

/**
 * 获取状态显示文本
 */
function getStatusText(status) {
  switch (status) {
    case '出摊中':
      return '● 出摊中';
    case '已收摊':
      return '○ 已收摊';
    case '休息':
      return '○ 休息';
    default:
      return '○ 未知';
  }
}

/**
 * 脱敏 IP 地址
 */
function maskIP(ip) {
  if (!ip) return '未知';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return ip;
}

/**
 * 图片轮播类
 */
class Gallery {
  constructor(containerSelector) {
    this.track = document.getElementById('galleryTrack');
    this.prevBtn = document.getElementById('galleryPrev');
    this.nextBtn = document.getElementById('galleryNext');
    this.dotsContainer = document.getElementById('galleryDots');
    this.currentIndex = 0;
    this.items = [];
    this.autoPlayTimer = null;
    
    this.init();
  }
  
  init() {
    if (!this.track) return;
    
    this.items = this.track.querySelectorAll('.gallery-item');
    if (this.items.length === 0) return;
    
    // 创建指示点
    this.createDots();
    
    // 绑定事件
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }
    
    // 自动播放
    this.startAutoPlay();
    
    // 暂停于悬停
    this.track.addEventListener('mouseenter', () => this.stopAutoPlay());
    this.track.addEventListener('mouseleave', () => this.startAutoPlay());
  }
  
  createDots() {
    if (!this.dotsContainer) return;
    
    this.items.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = `gallery-dot ${index === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => this.goTo(index));
      this.dotsContainer.appendChild(dot);
    });
  }
  
  updateDots() {
    if (!this.dotsContainer) return;
    
    const dots = this.dotsContainer.querySelectorAll('.gallery-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  }
  
  updateTrack() {
    if (!this.track) return;
    
    this.track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
  }
  
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.updateTrack();
    this.updateDots();
  }
  
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.updateTrack();
    this.updateDots();
  }
  
  goTo(index) {
    this.currentIndex = index;
    this.updateTrack();
    this.updateDots();
  }
  
  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => this.next(), 5000);
  }
  
  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }
}

/**
 * 弹窗控制类
 */
class Modal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.closeBtn = null;
    this.cancelBtn = null;
    
    if (this.modal) {
      this.closeBtn = this.modal.querySelector('.modal-close');
      this.cancelBtn = this.modal.querySelector('.modal-btn-cancel, #modalCancel, #editHistoryCancel');
      
      this.bindEvents();
    }
  }
  
  bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.hide());
    }
    
    // 点击背景关闭
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }
  
  show() {
    if (this.modal) {
      this.modal.classList.add('show');
    }
  }
  
  hide() {
    if (this.modal) {
      this.modal.classList.remove('show');
    }
  }
}

// 初始化轮播
document.addEventListener('DOMContentLoaded', () => {
  new Gallery('.gallery');
});

// 导出
window.apiRequest = apiRequest;
window.getTodayStatus = getTodayStatus;
window.updateTodayStatus = updateTodayStatus;
window.getHistoryList = getHistoryList;
window.getHistoryByDate = getHistoryByDate;
window.updateHistory = updateHistory;
window.getReviews = getReviews;
window.submitReview = submitReview;
window.deleteReview = deleteReview;
window.exportReviews = exportReviews;
window.login = login;
window.logout = logout;
window.isLoggedIn = isLoggedIn;
window.showToast = showToast;
window.formatDate = formatDate;
window.formatTimeDisplay = formatTimeDisplay;
window.getStatusClass = getStatusClass;
window.getStatusText = getStatusText;
window.maskIP = maskIP;
window.Gallery = Gallery;
window.Modal = Modal;
