// api/card.js
const { connectToDatabase } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

function handleError(res, err) {
  console.error(err);
  return res.status(500).json({ error: err.message || 'Internal Server Error' });
}

module.exports = async function handler(req, res) {
  const { method, query, body } = req;
  const { menuId, subMenuId, id } = query;

  try {
    const db = await connectToDatabase();

    // ======================
    // 公开接口：GET /api/card?menuId=xxx[&subMenuId=yyy]
    // ======================
    if (method === 'GET') {
      if (!menuId) {
        return res.status(400).json({ error: 'menuId is required' });
      }

      let condition = 'menu_id = ?';
      let params = [menuId];

      if (subMenuId) {
        condition = 'sub_menu_id = ?';
        params = [subMenuId];
      } else {
        condition += ' AND sub_menu_id IS NULL';
      }

      const [rows] = await db.execute(
        `SELECT id, menu_id, sub_menu_id, title, url, logo_url, \`desc\`, \`order\` 
         FROM cards 
         WHERE ${condition} 
         ORDER BY \`order\` ASC`,
        params
      );

      const result = rows.map(card => {
        let display_logo = card.logo_url;
        if (!display_logo) {
          try {
            const url = new URL(card.url);
            display_logo = `${url.origin}/favicon.ico`;
          } catch (e) {
            display_logo = '';
          }
        }
        return { ...card, display_logo };
      });

      return res.status(200).json(result);
    }

    // ======================
    // 需要认证的操作：POST / PUT / DELETE
    // ======================
    const authResult = verifyToken(req.headers.authorization);
    if (!authResult.valid) {
      return res.status(401).json({ error: authResult.error });
    }

    if (method === 'POST') {
      const {
        menu_id,
        sub_menu_id,
        title,
        url,
        logo_url,
        desc,
        order
      } = body;

      const newCard = {
        menu_id: menu_id ?? null,
        sub_menu_id: sub_menu_id ?? null,
        title: title ?? '',
        url: url ?? '',
        logo_url: logo_url ?? '',
        desc: desc ?? '',
        order: parseInt(order) || 0
      };

      const [result] = await db.execute(
        `INSERT INTO cards (
          menu_id, sub_menu_id, title, url,
          logo_url, \`desc\`, \`order\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          newCard.menu_id,
          newCard.sub_menu_id,
          newCard.title,
          newCard.url,
          newCard.logo_url,
          newCard.desc,
          newCard.order
        ]
      );

      return res.status(201).json({ id: result.insertId });
    }

    if (method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });

      const {
        menu_id,
        sub_menu_id,
        title,
        url,
        logo_url,
        desc,
        order
      } = body;

      const updates = {
        menu_id: menu_id ?? null,
        sub_menu_id: sub_menu_id ?? null,
        title: title ?? '',
        url: url ?? '',
        logo_url: logo_url ?? '',
        desc: desc ?? '',
        order: parseInt(order) || 0
      };

      const setClause = Object.keys(updates)
        .map(key => {
          if (key === 'desc' || key === 'order') {
            return `\`${key}\` = ?`;
          }
          return `${key} = ?`;
        })
        .join(', ');

      const values = [...Object.values(updates), id];

      const [result] = await db.execute(
        `UPDATE cards SET ${setClause} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '卡片不存在' });
      }

      return res.status(200).json({ changed: result.affectedRows });
    }

    if (method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id is required' });

      const [result] = await db.execute('DELETE FROM cards WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '卡片不存在' });
      }

      return res.status(200).json({ deleted: result.affectedRows });
    }

    // 方法不支持
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);

  } catch (err) {
    handleError(res, err);
  }
};