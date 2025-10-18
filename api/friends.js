// api/friends.js
const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

function handleError(res, err, message = '服务器内部错误') {
  console.error(err);
  return res.status(500).json({
    error: message,
    errMsg: err.message
  });
}

module.exports = async function handler(req, res) {
  const { method, query, body } = req;
  const { id } = query; // PUT/DELETE 使用 ?id=xxx

  try {
    const db = await connectToDatabase();

    // ======================
    // 公开接口：GET /api/friends
    // ======================
    if (method === 'GET') {
      const { page, pageSize } = query;
      const hasPagination = page || pageSize;

      let pageNum = 1;
      let pageSizeVal = 10;
      let useAll = false;

      if (hasPagination) {
        pageNum = parseInt(page, 10) || 1;
        if (pageSize && pageSize.toLowerCase() === 'all') {
          useAll = true;
        } else {
          pageSizeVal = parseInt(pageSize, 10);
          pageSizeVal = Math.max(pageSizeVal, 1) || 10;
        }
      }

      let sql = 'SELECT * FROM friends';
      let queryParams = [];

      if (hasPagination && !useAll) {
        const offset = (pageNum - 1) * pageSizeVal;
        sql += ` LIMIT ${pageSizeVal} OFFSET ${offset}`;
      }

      const [rows] = await db.execute(sql, queryParams);

      let total = rows.length;
      if (hasPagination) {
        const [countResult] = await db.execute('SELECT COUNT(*) AS total FROM friends');
        total = countResult[0].total;
      }

      if (!hasPagination) {
        return res.status(200).json(rows);
      }

      return res.status(200).json({
        total,
        page: pageNum,
        pageSize: useAll ? total : pageSizeVal,
        data: rows
      });
    }

    // ======================
    // 需要认证的操作
    // ======================
    const authResult = verifyToken(req.headers.authorization);
    if (!authResult.valid) {
      return res.status(401).json({ error: authResult.error });
    }

    if (method === 'POST') {
      const { title, url, logo } = body;

      if (!title || !url) {
        return res.status(400).json({ error: '标题和链接为必填项' });
      }

      const [result] = await db.execute(
        'INSERT INTO friends (title, url, logo) VALUES (?, ?, ?)',
        [title, url, logo]
      );

      if (result.insertId > 0) {
        return res.status(201).json({ id: result.insertId });
      } else {
        return res.status(500).json({ error: '数据库错误，插入失败' });
      }
    }

    if (method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { title, url, logo } = body;

      const [result] = await db.execute(
        `UPDATE friends 
         SET 
           title = COALESCE(?, title),
           url = COALESCE(?, url),
           logo = COALESCE(?, logo)
         WHERE id = ?`,
        [title || null, url || null, logo || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '友链不存在' });
      }

      return res.status(200).json({ changed: result.affectedRows });
    }

    if (method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id is required' });

      const [result] = await db.execute('DELETE FROM friends WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '友链不存在' });
      }

      return res.status(200).json({ deleted: result.affectedRows });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);

  } catch (err) {
    console.error('友链操作失败:', err);
    if (err.errno === 1062) {
      return res.status(409).json({ error: '链接已存在' });
    }
    return res.status(500).json({
      error: '服务器错误',
      message: err.sqlMessage || err.message
    });
  }
};