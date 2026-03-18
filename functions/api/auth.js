/**
 * 🔥 烧饼小摊 - 认证 API
 * 管理员密码验证
 */

// 注意：生产环境中请使用环境变量存储密码哈希
// 这里使用简单的密码验证，实际部署时请修改 DEFAULT_ADMIN_PASSWORD

const DEFAULT_ADMIN_PASSWORD = 'shaobing2026'; // 默认密码，请修改

export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (!password) {
      return jsonResponse({ error: '缺少密码', success: false }, 400);
    }
    
    // 获取存储的密码（可以是明文或哈希）
    let storedPassword = await env.KV.get('admin:password');
    
    // 如果没有设置密码，使用默认密码
    if (!storedPassword) {
      storedPassword = DEFAULT_ADMIN_PASSWORD;
    }
    
    // 简单密码验证（生产环境请使用 bcrypt 等哈希验证）
    const isValid = password === storedPassword;
    
    if (isValid) {
      // 生成简单 token（生产环境请使用 JWT）
      const token = generateToken();
      
      return jsonResponse({
        success: true,
        token: token,
        expiresIn: 86400 // 24 小时
      });
    } else {
      return jsonResponse({
        success: false,
        error: '密码错误'
      }, 401);
    }
  } catch (error) {
    console.error('认证失败:', error);
    return jsonResponse({ error: '服务器错误', success: false }, 500);
  }
}

/**
 * 生成简单 token
 * 生产环境请使用更安全的 JWT
 */
function generateToken() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `token_${timestamp}_${random}`;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
