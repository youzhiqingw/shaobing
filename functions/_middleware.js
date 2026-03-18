/**
 * 🔥 烧饼小摊 - 全局中间件
 * 处理 CORS 和通用请求
 */

export async function onRequest(context) {
  const { request, next } = context;
  
  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  // 继续处理请求
  const response = await next();
  
  // 添加 CORS 头
  return addCORSHeaders(response);
}

function handleCORS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function addCORSHeaders(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
