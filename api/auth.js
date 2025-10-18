// api/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('../lib/db');
const config = require('../config');

// 获取客户端IP
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  return ip;
}

// 获取上海标准时间
function getShanghaiTime() {
  const date = new Date();
  const shanghaiTime = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })
  );
  const y = shanghaiTime.getFullYear();
  const m = String(shanghaiTime.getMonth() + 1).padStart(2, '0');
  const d = String(shanghaiTime.getDate()).padStart(2, '0');
  const h = String(shanghaiTime.getHours()).padStart(2, '0');
  const min = String(shanghaiTime.getMinutes()).padStart(2, '0');
  const s = String(shanghaiTime.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const db = await connectToDatabase();

    // 查询用户
    const [rows] = await db.execute(
      `SELECT id, username, password, last_login_time, last_login_ip 
       FROM users 
       WHERE username = ?`,
      [username]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 获取登录信息
    const ip = getClientIp(req);
    const now = getShanghaiTime();

    // 使用事务更新登录记录
    await db.beginTransaction();
    try {
      await db.execute(
        `UPDATE users 
         SET last_login_time = ?, 
             last_login_ip = ? 
         WHERE id = ?`,
        [now, ip, user.id]
      );

      // 如果需要记录登录日志，可在此处添加 INSERT

      await db.commit();
    } catch (err) {
      await db.rollback();
      console.error('事务更新失败:', err);
      return res.status(500).json({ error: '登录记录失败，请重试' });
    }

    // 生成 token
    const token = jwt.sign(
      { uid: user.id, username: user.username },
      config.server.jwtSecret,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      token,
      lastLoginTime: user.last_login_time || null,
      lastLoginIp: user.last_login_ip || null,
    });

  } catch (error) {
    console.error('Login error:', error);
    if (error.message.includes('bcrypt')) {
      return res.status(401).json({ error: '密码验证失败' });
    }
    return res.status(500).json({ error: '服务器错误，请重试' });
  }
}