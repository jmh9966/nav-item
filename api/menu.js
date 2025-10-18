// api/menu.js
const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

function handleError(res, err, customMsg) {
  console.error(err);
  return res.status(500).json({ error: customMsg || err.message || 'Internal Server Error' });
}

module.exports = async function handler(req, res) {
  const { method, query, body } = req;
  const { id } = query;

  try {
    const db = await connectToDatabase();

    // GET /api/menu → 获取所有主菜单 + 子菜单（公开）
    if (method === 'GET') {
      const [menus] = await db.execute('SELECT * FROM menus ORDER BY `order` ASC');
      const menusWithSub = await Promise.all(
        menus.map(async (menu) => {
          const [subMenus] = await db.execute(
            'SELECT * FROM sub_menus WHERE parent_id = ? ORDER BY `order` ASC',
            [menu.id]
          );
          return { ...menu, subMenus };
        })
      );
      return res.status(200).json(menusWithSub);
    }

    // 需要认证的操作
    const authResult = verifyToken(req.headers.authorization);
    if (!authResult.valid) {
      return res.status(401).json({ error: authResult.error });
    }

    // POST /api/menu → 新增主菜单
    if (method === 'POST') {
      const { name, order } = body;
      const parsedOrder = parseInt(order) || 0;

      try {
        const [result] = await db.execute(
          'INSERT INTO menus (name, `order`) VALUES (?, ?)',
          [name, parsedOrder]
        );
        return res.status(201).json({ id: result.insertId });
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: '菜单名称已存在' });
        }
        throw err;
      }
    }

    // PUT /api/menu?id=123 → 修改主菜单
    if (method === 'PUT' && id) {
      const { name, order } = body;
      const parsedOrder = parseInt(order) || 0;

      const [result] = await db.execute(
        'UPDATE menus SET name = ?, `order` = ? WHERE id = ?',
        [name, parsedOrder, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '菜单不存在' });
      }
      return res.status(200).json({ changed: result.affectedRows });
    }

    // DELETE /api/menu?id=123 → 删除主菜单
    if (method === 'DELETE' && id) {
      const [result] = await db.execute('DELETE FROM menus WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '菜单不存在' });
      }
      return res.status(200).json({ deleted: result.affectedRows });
    }

    // 方法或参数不支持
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);

  } catch (err) {
    handleError(res, err, '菜单操作失败');
  }
};