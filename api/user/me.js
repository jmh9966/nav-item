// api/user/me.js
const { connectToDatabase } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '仅支持 GET 方法' });
  }

  const authResult = verifyToken(req.headers.authorization);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error });
  }
  const currentUserId = authResult.user.id;

  try {
    const db = await connectToDatabase();
    const [rows] = await db.execute(
      `SELECT last_login_time, last_login_ip FROM users WHERE id = ?`,
      [currentUserId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '获取用户详情失败' });
  }
}