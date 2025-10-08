const express = require('express');
const dbPool = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// 错误处理中间件，新增第 4 个参数 message 用于自定义错误信息
function handleError(res, err, message = '服务器内部错误') {
  console.error(err);
  return res.status(err.status || 500).json({
    error: message || '未知错误',
    errMsg: err.message // 开发环境可暴露具体错误信息
  });
}

// 获取友链列表路由，修复分页 SQL 语法错误
router.get('/', async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    const hasPagination = page || pageSize; // 检测是否使用分页模式

    let pageNum = 1,
      pageSizeVal = 10,
      useAll = false;

    if (hasPagination) {
      // 分页模式处理
      // 1. 解析页码参数
      pageNum = parseInt(page, 10) || 1;

      // 2. 解析 pageSize 值
      if (pageSize.toLowerCase() === 'all') {
        // 全量模式
        useAll = true;
      } else {
        pageSizeVal = parseInt(pageSize, 10);
        pageSizeVal = Math.max(pageSizeVal, 1) || 10;
      }
    }

    // 生成查询语句
    let query = 'SELECT * FROM friends';
    let queryParams = [];

    if (hasPagination && !useAll) {
      // 计算 LIMIt 和 OFFSET
      const offset = (pageNum - 1) * pageSizeVal;
      query += ` LIMIT ${pageSizeVal} OFFSET ${offset}`;
    }

    // 执行查询
    const [rows] = await dbPool.query(query, queryParams);

    // 获取总记录数（仅分页模式需要）
    let total = rows.length;
    if (hasPagination) {
      const [countResult] = await dbPool.query('SELECT COUNT(*) AS total FROM friends');
      total = countResult[0].total;
    }

    // 返回数据格式根据模式变化
    if (!hasPagination) {
      // 直接返回数据数组，符合原版行为
      return res.json(rows);
    }

    // 分页模式返回结构
    return res.json({
      total,
      page: pageNum,
      pageSize: useAll ? total : pageSizeVal,
      data: rows
    });
  } catch (err) {
    console.error('获取友链列表失败:', err);
    res.status(500).json({
      error: '服务器错误',
      message: err.sqlMessage || err.message
    });
  }
});


// 新增友链路由，添加字段校验逻辑
router.post('/', auth, async (req, res) => {
  try {
    const { title, url, logo } = req.body;

    // 字段校验：title和url必须
    if (!title || !url) {
      return res.status(400).json({ error: '标题和链接为必填项' });
    }

    const [result] = await dbPool.query(
      'INSERT INTO friends (title, url, logo) VALUES (?, ?, ?)',
      [title, url, logo]
    );

    // 验证插入是否成功
    if (result.insertId > 0) {
      return res.status(201).json({ id: result.insertId });
    } else {
      return res.status(500).json({ error: '数据库错误，插入失败' });
    }
  } catch (err) {
    if (err.errno === 1062) { // 处理唯一性约束冲突
      return res.status(409).json({ error: '链接已存在' });
    }
    handleError(res, err, '新增友链失败');
  }
});

// 修改友链路由，使用 COALESCE 处理可选字段
router.put('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, url, logo } = req.body;

    const [result] = await dbPool.query(
      `UPDATE friends 
       SET 
          title = COALESCE(?, title),
          url = COALESCE(?, url),
          logo = COALESCE(?, logo)
       WHERE id = ?`,
      [title, url, logo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '友链不存在' });
    }

    return res.json({ changed: result.affectedRows });
  } catch (err) {
    handleError(res, err, '更新友链失败');
  }
});

// 删除友链路由，添加操作反馈
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await dbPool.query('DELETE FROM friends WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '友链不存在' });
    }

    return res.json({ deleted: result.affectedRows });
  } catch (err) {
    handleError(res, err, '删除友链失败');
  }
});

module.exports = router;