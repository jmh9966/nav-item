// lib/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 验证 Bearer Token
 * @param {string} authHeader - Authorization header
 * @returns {{ valid: boolean, user?: { id: number }, error?: string }}
 */
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: '未找到认证令牌' };
  }

  const token = authHeader.substring(7); // "Bearer xxx" → "xxx"
  try {
    const decoded = jwt.verify(token, config.server.jwtSecret);
    if (!decoded || !decoded.uid) {
      return { valid: false, error: '无效的 JWT 令牌' };
    }
    return { valid: true, user: { id: decoded.uid } };
  } catch (error) {
    console.error('认证失败:', error.message);
    return { valid: false, error: '无效或过期的令牌' };
  }
}

module.exports = { verifyToken };