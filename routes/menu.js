const express = require('express');
const dbPool = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// 全局错误处理
async function handleError(res, err, customMsg) {
  console.error(err);
  if (customMsg) return res.status(500).json({ error: customMsg });
  res.status(500).json({ error: err.message });
}

// 获取菜单和子菜单
router.get('/', async (req, res) => {
  try {
   
    
      // 直接获取所有主菜单（包含子菜单）
      const [menuResult] = await dbPool.query('SELECT * FROM menus ORDER BY `order` ASC');
      total = menuResult.length;
      menus = menuResult;
    

    // 追加子菜单到每个主菜单
    const getSubMenus = async (parentId) => {
      try {
        const [subMenus] = await dbPool.query(
          'SELECT * FROM sub_menus WHERE parent_id = ? ORDER BY `order` ASC',
          [parentId]
        );
        return subMenus;
      } catch (err) {
        return [];
      }
    };

    const menusWithSub = await Promise.all(
      menus.map(async menu => ({
        ...menu,
        subMenus: await getSubMenus(menu.id) // 使用async/await避免嵌套
      }))
    );

    res.json(menusWithSub);
  } catch (err) {
    handleError(res, err);
  }
});

// 获取特定菜单的子菜单
router.get('/:id/submenus', async (req, res) => {
  const parentId = req.params.id;
  try {
    const [rows] = await dbPool.query(
      'SELECT * FROM sub_menus WHERE parent_id = ? ORDER BY `order`',
      [parentId]
    );
    res.json(rows);
  } catch (err) {
    handleError(res, err);
  }
});

// 新增菜单
router.post('/', auth, async (req, res) => {
  try {
    const { name, order } = req.body;
    const parsedOrder = parseInt(order) || 0;
    
    const [result] = await dbPool.query(`
      INSERT INTO menus (name, \`order\`)
      VALUES (?, ?)
    `, [name, parsedOrder]);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: '菜单名称已存在' });
    }
    handleError(res, err, '新增菜单失败');
  }
});

// 修改菜单
router.put('/:id', auth, async (req, res) => {
  const menuId = req.params.id;
  const { name, order } = req.body;
  const parsedOrder = parseInt(order) || 0;

  try {
    const [result] = await dbPool.query(`
      UPDATE menus 
      SET name=?, \`order\`=? 
      WHERE id=?
    `, [name, parsedOrder, menuId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '菜单不存在' });
    }

    res.json({ changed: result.affectedRows });
  } catch (err) {
    handleError(res, err, '修改菜单失败');
  }
});

// 删除菜单
router.delete('/:id', auth, async (req, res) => {
  const menuId = req.params.id;
  try {
    const [result] = await dbPool.query(
      'DELETE FROM menus WHERE id = ?',
      [menuId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '菜单不存在' });
    }

    res.json({ deleted: result.affectedRows });
  } catch (err) {
    handleError(res, err, '删除菜单失败');
  }
});

// 子菜单的增删改
// 新增子菜单
router.post('/:id/submenus', auth, async (req, res) => {
  try {
    const parentId = req.params.id;
    const { name, order } = req.body;
    const parsedOrder = parseInt(order) || 0;

    const [result] = await dbPool.query(`
      INSERT INTO sub_menus (parent_id, name, \`order\`)
      VALUES (?, ?, ?)
    `, [parentId, name, parsedOrder]);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    handleError(res, err, '新增子菜单失败');
  }
});

// 修改子菜单
router.put('/submenus/:id', auth, async (req, res) => {
  const subMenuId = req.params.id;
  const { name, order } = req.body;
  const parsedOrder = parseInt(order) || 0;

  try {
    const [result] = await dbPool.query(`
      UPDATE sub_menus 
      SET name=?, \`order\`=? 
      WHERE id=?
    `, [name, parsedOrder, subMenuId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '子菜单不存在' });
    }

    res.json({ changed: result.affectedRows });
  } catch (err) {
    handleError(res, err, '修改子菜单失败');
  }
});

// 删除子菜单
router.delete('/submenus/:id', auth, async (req, res) => {
  const subMenuId = req.params.id;
  try {
    const [result] = await dbPool.query(
      'DELETE FROM sub_menus WHERE id = ?',
      [subMenuId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '子菜单不存在' });
    }

    res.json({ deleted: result.affectedRows });
  } catch (err) {
    handleError(res, err, '删除子菜单失败');
  }
});

module.exports = router;