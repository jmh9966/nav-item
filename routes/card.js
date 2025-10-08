const express = require('express');
const dbPool  = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// 自定义错误处理
function handleError(res, err) {
  console.error(err);
  return res.status(500).json({ error: err.message });
}

// 获取卡片列表
router.get('/:menuId', async (req, res) => {
  try {
    const menuId = req.params.menuId;
    const subMenuId = req.query.subMenuId;

    let condition = "menu_id = ?";
    let params = [menuId];

    if (subMenuId) {
      condition = "sub_menu_id = ?";
      params = [subMenuId];
    } else {
      condition += " AND sub_menu_id IS NULL";
    }

    // 注意对保留字 `order` 使用反引号
    const [rows] = await dbPool.query(`
      SELECT * FROM cards 
      WHERE ${condition} 
      ORDER BY \`order\` ASC
    `, params);

    rows.forEach(card => {
      if (!card.custom_logo_path) {
        card.display_logo = card.logo_url || 
          (card.url.replace(/\/+$/, '') + '/favicon.ico');
      } else {
        card.display_logo = `/uploads/${card.custom_logo_path}`;
      }
    });

    return res.json(rows);
  } catch (err) {
    handleError(res, err);
  }
});

// 创建卡片
router.post('/', auth, async (req, res) => {
  try {
    const { 
      menu_id, 
      sub_menu_id, 
      title, 
      url, 
      logo_url, 
      custom_logo_path, 
      desc, 
      order 
    } = req.body;

    const newCard = {
      menu_id,
      sub_menu_id: sub_menu_id || null,
      title,
      url,
      logo_url,
      custom_logo_path,
      desc,
      order: parseInt(order) || 0
    };

    // 注意 `order` 和 `desc` 的保留字处理
    const [result] = await dbPool.query(`
      INSERT INTO cards (
        menu_id, sub_menu_id, title, url, 
        logo_url, custom_logo_path, \`desc\`, \`order\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newCard.menu_id,
      newCard.sub_menu_id,
      newCard.title,
      newCard.url,
      newCard.logo_url,
      newCard.custom_logo_path,
      newCard.desc,
      newCard.order
    ]);

    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    handleError(res, err);
  }
});

// 更新卡片
router.put('/:id', auth, async (req, res) => {
  try {
    const cardId = req.params.id;
    const {
      menu_id,
      sub_menu_id,
      title,
      url,
      logo_url,
      custom_logo_path,
      desc,
      order
    } = req.body;

    const updates = {
      menu_id,
      sub_menu_id: sub_menu_id || null,
      title,
      url,
      logo_url,
      custom_logo_path,
      desc,
      order: parseInt(order) || 0
    };

    const setClause = Object.entries(updates)
      .map(([key, value]) => `${ `${key}` === 'desc' || key === 'order' 
        ? '`' + key + '`'
        : key } = ?`)
      .join(', ');

    // 构建查询
    const [result] = await dbPool.query(`
      UPDATE cards SET ${setClause} WHERE id = ?
    `, [
      ...Object.values(updates),
      cardId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '卡片不存在' });
    }

    return res.json({ changed: result.affectedRows });
  } catch (err) {
    handleError(res, err);
  }
});

// 删除卡片
router.delete('/:id', auth, async (req, res) => {
  try {
    const cardId = req.params.id;
    
    const [result] = await dbPool.query(`
      DELETE FROM cards WHERE id = ?
    `, [cardId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '卡片不存在' });
    }

    return res.json({ deleted: result.affectedRows });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;