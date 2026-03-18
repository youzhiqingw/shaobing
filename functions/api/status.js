/**
 * 🔥 烧饼小摊 - 今日状态 API
 */

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  
  try {
    if (date) {
      // 获取指定日期状态
      const key = `status:${date}`;
      const data = await env.KV.get(key);
      
      if (data) {
        return jsonResponse(JSON.parse(data));
      } else {
        return jsonResponse({ error: '未找到该日期状态' }, 404);
      }
    } else {
      // 获取今日状态
      const today = new Date().toISOString().split('T')[0];
      const key = `status:${today}`;
      let data = await env.KV.get(key);
      
      if (!data) {
        // 初始化今日状态
        const defaultStatus = {
          date: today,
          isOpen: false,
          status: '休息',
          location: '-',
          time: '-',
          note: '尚未出摊',
          updatedAt: new Date().toISOString()
        };
        data = JSON.stringify(defaultStatus);
        await env.KV.put(key, data);
      }
      
      return jsonResponse(JSON.parse(data));
    }
  } catch (error) {
    console.error('获取状态失败:', error);
    return jsonResponse({ error: '服务器错误' }, 500);
  }
}

export async function onRequestPut({ env, request }) {
  try {
    const body = await request.json();
    const today = new Date().toISOString().split('T')[0];
    
    const statusData = {
      date: today,
      isOpen: body.status === '出摊中',
      status: body.status || '休息',
      location: body.location || '-',
      time: body.time || '-',
      note: body.note || '',
      updatedAt: new Date().toISOString()
    };
    
    const key = `status:${today}`;
    await env.KV.put(key, JSON.stringify(statusData));
    
    // 同时更新历史记录
    await updateHistory(env, today, statusData);
    
    return jsonResponse({ success: true, data: statusData });
  } catch (error) {
    console.error('更新状态失败:', error);
    return jsonResponse({ error: '服务器错误' }, 500);
  }
}

/**
 * 更新历史记录
 */
async function updateHistory(env, date, statusData) {
  try {
    // 获取历史记录
    const historyData = await env.KV.get('history');
    let history = historyData ? JSON.parse(historyData) : [];
    
    // 查找是否已存在该日期记录
    const existingIndex = history.findIndex(item => item.date === date);
    
    const historyItem = {
      date: statusData.date,
      isOpen: statusData.isOpen,
      status: statusData.status,
      location: statusData.location,
      time: statusData.time,
      note: statusData.note,
      updatedAt: statusData.updatedAt
    };
    
    if (existingIndex >= 0) {
      // 更新现有记录
      history[existingIndex] = historyItem;
    } else {
      // 添加新记录
      history.unshift(historyItem);
    }
    
    // 保留最近 90 天
    history = history.slice(0, 90);
    
    await env.KV.put('history', JSON.stringify(history));
    
    // 同时存储单独的状态记录
    await env.KV.put(`status:${date}`, JSON.stringify(historyItem));
    
  } catch (error) {
    console.error('更新历史记录失败:', error);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
