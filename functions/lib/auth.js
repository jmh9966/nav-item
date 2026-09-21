// lib/auth.js - CF Pages Functions 兼容版
const jwt = require('jsonwebtoken');

/**
 * CF Functions 中验证 JWT
 * @param {string} authHeader - Authorization header
 * @param {object} env - Cloudflare env 对象
 * @returns {{ valid: boolean, user?: { id: number }, error?: string }}
 */
function verifyToken(authHeader, env = {}) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: '未找到认证令牌' };
  }

  const token = authHeader.substring(7);
  const jwtSecret = env.JWT_SECRET || 'nav-item-jwt-secret-cf-2024';
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded || !decoded.uid) {
      return { valid: false, error: '无效的 JWT 令牌' };
    }
    return { valid: true, user: { id: decoded.uid } };
  } catch (error) {
    console.error('认证失败:', error.message);
    return { valid: false, error: '无效或过期的令牌' };
  }
}

export { verifyToken };