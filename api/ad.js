// api/ad.js
const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

// 错误处理
function handleError(res, err) {
  console.error(err);
  return res.status(500).json({ error: err.message || 'Internal Server Error' });
}

export default async function handler(req, res) {
	const { method } = req;
	const { id } = req.query; // DELETE / PUT /ad?id=123

  try {
    const db = await connectToDatabase();

    // GET /api/ad → 获取广告列表
    if (method === 'GET') {
      const { page, pageSize } = req.query;
      const pageNum = page ? parseInt(page, 10) : 0;
      const size = pageSize ? parseInt(pageSize, 10) : 0;

      if (!pageNum && !size) {
        const [rows] = await db.execute('SELECT * FROM ads');
        return res.status(200).json(rows);
      }

      const [countResult] = await db.execute('SELECT COUNT(*) AS total FROM ads');
      const total = countResult[0].total;
      const offset = (pageNum - 1) * size;

      const [rows] = await db.execute(
        'SELECT * FROM ads LIMIT ? OFFSET ?',
        [size, offset]
      );

      return res.status(200).json({
        total,
        page: pageNum,
        pageSize: size,
        data: rows,
      });
    }

    // 需要认证的操作：POST / PUT / DELETE
	const authResult = verifyToken(req.headers.authorization);
	if (!authResult.valid) {
	  return res.status(401).json({ error: authResult.error });
    }

    // POST /api/ad → 新增广告
    if (method === 'POST') {
      const { position, img, url } = req.body;
      const [result] = await db.execute(
        'INSERT INTO ads (position, img, url) VALUES (?, ?, ?)',
        [position, img, url]
      );
      return res.status(201).json({ id: result.insertId });
    }

    // PUT /api/ad?id=123 → 修改广告
    if (method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { img, url } = req.body;
      const [result] = await db.execute(
        'UPDATE ads SET img = ?, url = ? WHERE id = ?',
        [img, url, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '广告不存在' });
      }
      return res.status(200).json({ changed: result.affectedRows });
    }

    // DELETE /api/ad?id=123 → 删除广告
    if (method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const [result] = await db.execute(
        'DELETE FROM ads WHERE id = ?',
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '广告不存在' });
      }
      return res.status(200).json({ deleted: result.affectedRows });
    }

    // 方法不支持
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);

  } catch (err) {
    handleError(res, err);
  }
}