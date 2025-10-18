// api/submenus.js
const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

function handleError(res, err, customMsg) {
  console.error(err);
  return res.status(500).json({ error: customMsg || err.message || 'Internal Server Error' });
}

module.exports = async function handler(req, res) {
  const { method, query, body } = req;
  const { id, parentId } = query;

  try {
    const db = await connectToDatabase();

    // GET /api/submenus?parentId=123 → 获取子菜单（公开）
    if (method === 'GET' && parentId) {
      const [subMenus] = await db.execute(
        'SELECT * FROM sub_menus WHERE parent_id = ? ORDER BY `order` ASC',
        [parentId]
      );
      return res.status(200).json(subMenus);
    }

    // 需要认证的操作
    const authResult = verifyToken(req.headers.authorization);
    if (!authResult.valid) {
      return res.status(401).json({ error: authResult.error });
    }

    // POST /api/submenus?parentId=123 → 新增子菜单
    if (method === 'POST' && parentId) {
      const { name, order } = body;
      const parsedOrder = parseInt(order) || 0;

      const [result] = await db.execute(
        'INSERT INTO sub_menus (parent_id, name, `order`) VALUES (?, ?, ?)',
        [parentId, name, parsedOrder]
      );
      return res.status(201).json({ id: result.insertId });
    }

    // PUT /api/submenus?id=456 → 修改子菜单
    if (method === 'PUT' && id) {
      const { name, order } = body;
      const parsedOrder = parseInt(order) || 0;

      const [result] = await db.execute(
        'UPDATE sub_menus SET name = ?, `order` = ? WHERE id = ?',
        [name, parsedOrder, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '子菜单不存在' });
      }
      return res.status(200).json({ changed: result.affectedRows });
    }

    // DELETE /api/submenus?id=456 → 删除子菜单
    if (method === 'DELETE' && id) {
      const [result] = await db.execute('DELETE FROM sub_menus WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '子菜单不存在' });
      }
      return res.status(200).json({ deleted: result.affectedRows });
    }

    // 缺少必要参数
    return res.status(400).json({ error: '缺少 parentId（POST/GET）或 id（PUT/DELETE）参数' });

  } catch (err) {
    handleError(res, err, '子菜单操作失败');
  }
};