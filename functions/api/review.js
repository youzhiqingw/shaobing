/**
 * 🔥 烧饼小摊 - 评价管理 API
 */

const MAX_REVIEWS = 500;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 小时

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  
  try {
    const reviewsData = await env.KV.get('reviews');
    let reviews = reviewsData ? JSON.parse(reviewsData) : [];
    
    // 按时间倒序排列，返回最新的
    reviews = reviews.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // 限制返回数量
    reviews = reviews.slice(0, limit);
    
    return jsonResponse(reviews);
  } catch (error) {
    console.error('获取评价失败:', error);
    return jsonResponse({ error: '服务器错误' }, 500);
  }
}

export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const { type, content } = body;
    
    // 验证类型
    if (!type || !['good', 'bad'].includes(type)) {
      return jsonResponse({ error: '无效的评价类型' }, 400);
    }
    
    // 获取客户端 IP
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // 速率限制检查
    const rateLimitKey = `rate_limit:${ip}`;
    const lastReviewTime = await env.KV.get(rateLimitKey);
    
    if (lastReviewTime) {
      const now = Date.now();
      if (now - parseInt(lastReviewTime) < RATE_LIMIT_WINDOW) {
        return jsonResponse({ 
          error: '速率限制：每小时只能评价一次',
          retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - parseInt(lastReviewTime))) / 1000)
        }, 429);
      }
    }
    
    // 创建评价
    const review = {
      id: Date.now().toString(),
      type: type,
      content: content ? content.trim().slice(0, 100) : '',
      ip: ip,
      createdAt: new Date().toISOString()
    };
    
    // 获取现有评价
    const reviewsData = await env.KV.get('reviews');
    let reviews = reviewsData ? JSON.parse(reviewsData) : [];
    
    // 添加新评价
    reviews.push(review);
    
    // 保留最近 500 条
    reviews = reviews.slice(-MAX_REVIEWS);
    
    await env.KV.put('reviews', JSON.stringify(reviews));
    
    // 更新速率限制
    await env.KV.put(rateLimitKey, Date.now().toString(), { expirationTtl: 7200 });
    
    return jsonResponse({ success: true, data: review }, 201);
  } catch (error) {
    console.error('提交评价失败:', error);
    return jsonResponse({ error: '服务器错误' }, 500);
  }
}

export async function onRequestDelete({ env, params, request }) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return jsonResponse({ error: '缺少评价 ID' }, 400);
    }
    
    // 获取现有评价
    const reviewsData = await env.KV.get('reviews');
    let reviews = reviewsData ? JSON.parse(reviewsData) : [];
    
    // 过滤掉要删除的评价
    const newReviews = reviews.filter(r => r.id !== id);
    
    if (newReviews.length === reviews.length) {
      return jsonResponse({ error: '未找到该评价' }, 404);
    }
    
    await env.KV.put('reviews', JSON.stringify(newReviews));
    
    return jsonResponse({ success: true });
  } catch (error) {
    console.error('删除评价失败:', error);
    return jsonResponse({ error: '服务器错误' }, 500);
  }
}

// 导出评价数据
export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  if (url.searchParams.has('export')) {
    try {
      const reviewsData = await env.KV.get('reviews');
      const reviews = reviewsData ? JSON.parse(reviewsData) : [];
      
      // 导出时脱敏 IP
      const exportedReviews = reviews.map(r => ({
        ...r,
        ip: maskIP(r.ip)
      }));
      
      return jsonResponse(exportedReviews);
    } catch (error) {
      console.error('导出评价失败:', error);
      return jsonResponse({ error: '服务器错误' }, 500);
    }
  }
  
  return jsonResponse({ error: '方法不允许' }, 405);
}

/**
 * 脱敏 IP 地址
 */
function maskIP(ip) {
  if (!ip || ip === 'unknown') return '未知';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return ip;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
