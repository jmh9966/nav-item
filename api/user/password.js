// api/user/password.js
const { connectToDatabase } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: '仅支持 PUT 方法' });
  }

  const authResult = verifyToken(req.headers.authorization);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error });
  }
  const currentUserId = authResult.user.id;

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请提供旧密码和新密码' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少需要6位' });
  }

  try {
    const db = await connectToDatabase();
    const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [currentUserId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = rows[0];
    const validOld = await bcrypt.compare(oldPassword, user.password);
    if (!validOld) {
      return res.status(400).json({ error: '旧密码错误' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, currentUserId]);

    return res.status(200).json({ success: true, message: '密码更新成功' });
  } catch (err) {
    if (err.message?.includes('bcrypt')) {
      return res.status(400).json({ error: '密码验证失败' });
    }
    console.error(err);
    return res.status(500).json({ error: '密码更新失败' });
  }
}