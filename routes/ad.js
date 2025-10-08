const express = require('express');
const auth = require('./authMiddleware');
const router = express.Router();
const dbPool = require('../db'); // 使用连接池

// 错误处理中间件
function handleError(res, err) {
  console.error(err);
  return res.status(500).json({ error: err.message });
}

// 获取广告列表
router.get('/', async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    const pageNum = page ? parseInt(page, 10) : 0;
    const size = pageSize ? parseInt(pageSize, 10) : 0;

    if (!pageNum && !size) {
      // 直接获取全部
      const [rows] = await dbPool.query('SELECT * FROM ads');
      return res.json(rows);
    }

    // 分页查询
    const [countResult] = await dbPool.query('SELECT COUNT(*) AS total FROM ads');
    const total = countResult[0].total;
    const offset = (pageNum - 1) * size;

    const [rows] = await dbPool.query(
      'SELECT * FROM ads LIMIT ? OFFSET ?',
      [size, offset]
    );
    
    res.json({
      total,
      page: pageNum,
      pageSize: size,
      data: rows
    });
  } catch (err) {
    handleError(res, err);
  }
});

// 新增广告
router.post('/', auth, async (req, res) => {
  try {
    const { position, img, url } = req.body;
    const [result] = await dbPool.query(
      'INSERT INTO ads (position, img, url) VALUES (?, ?, ?)',
      [position, img, url]
    );
    
    res.status(201).json({
      id: result.insertId
    });
  } catch (err) {
    handleError(res, err);
  }
});

// 修改广告
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { img, url } = req.body;
    
    const [result] = await dbPool.query(
      'UPDATE ads SET img=?, url=? WHERE id=?',
      [img, url, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '广告不存在' });
    }
    
    res.json({ changed: result.affectedRows });
  } catch (err) {
    handleError(res, err);
  }
});

// 删除广告
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await dbPool.query(
      'DELETE FROM ads WHERE id=?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '广告不存在' });
    }
    
    res.json({ deleted: result.affectedRows });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;