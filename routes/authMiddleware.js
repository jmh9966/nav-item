const jwt = require("jsonwebtoken");
const config = require("../config");
const JWT_SECRET = config.server.jwtSecret;

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未找到认证令牌" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 确保用户对象中包含 id 字段
    if (!decoded || !decoded.uid) {
      throw new Error("无效的 JWT 令牌");
    }
    req.user = { id: decoded.uid }; // 严格提取需要的字段
    next();
  } catch (error) {
    console.error("认证失败:", error.message);
    return res.status(401).json({ error: "无效或过期的令牌" });
  }
}

module.exports = authMiddleware;