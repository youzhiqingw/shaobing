/**
 * 🔥 烧饼小摊 - 历史记录 API
 */

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const date = url.pathname.split('/').pop();
  
  try {
    // 检查是否是查询特定日期
    if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // 获取指定日期状态
      const key = `status:${date}`;
      const data = await env.KV.get(key);
      
      if (data) {
        return jsonResponse(JSON.parse(data));
      } else {
        return jsonResponse(null);
      }
    } else {
      // 获取历史记录列表
      const limit = parseInt(url.searchParams.get('limit')) || 30;
      const offset = parseInt(url.searchParams.get('offset')) || 0;
      
      const historyData = await env.KV.get('history');
      let history = historyData ? JSON.parse(historyData) : [];
      
      // 分页
      const paginated = history.slice(offset, offset + limit);
      
      return jsonResponse(paginated);
    }
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return jsonResponse({ error: '服务器错误' }, 500);
  }
}

export async function onRequestPut({ env, request, params }) {
  try {
    const url = new URL(request.url);
    const date = url.pathname.split('/').pop();
    
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return jsonResponse({ error: '无效的日期格式' }, 400);
    }
    
    const body = await request.json();
    
    const statusData = {
      date: date,
      isOpen: body.status === '出摊中',
      status: body.status || '休息',
      location: body.location || '-',
      time: body.time || '-',
      note: body.note || '',
      updatedAt: new Date().toISOString()
    };
    
    // 更新历史记录
    const historyData = await env.KV.get('history');
    let history = historyData ? JSON.parse(historyData) : [];
    
    // 查找是否已存在该日期记录
    const existingIndex = history.findIndex(item => item.date === date);
    
    if (existingIndex >= 0) {
      // 更新现有记录
      history[existingIndex] = statusData;
    } else {
      // 添加新记录
      history.unshift(statusData);
    }
    
    // 保留最近 90 天
    history = history.slice(0, 90);
    
    await env.KV.put('history', JSON.stringify(history));
    
    // 同时存储单独的状态记录
    await env.KV.put(`status:${date}`, JSON.stringify(statusData));
    
    return jsonResponse({ success: true, data: statusData });
  } catch (error) {
    console.error('更新历史记录失败:', error);
    return jsonResponse({ error: '服务器错误' }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
