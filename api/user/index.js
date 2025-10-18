// api/user/index.js
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

  const { page = 1, pageSize = 10 } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || 10;
  const offset = (pageNum - 1) * size;

  try {
    const db = await connectToDatabase();

    const [totalResult] = await db.execute('SELECT COUNT(*) AS total FROM users');
    const total = totalResult[0].total;

    const [userRows] = await db.execute(
      'SELECT id, username FROM users LIMIT ? OFFSET ?',
      [size, offset]
    );

    return res.status(200).json({
      total,
      page: pageNum,
      pageSize: size,
      data: userRows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '获取用户列表失败' });
  }
}