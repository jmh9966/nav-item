// functions/api/[[path]].js
import { verifyToken } from '../lib/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 🛠️ 基础工具函数
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' }
});
const now = () => new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
const clientIP = (req) => req.headers.get('cf-connecting-ip') || 'unknown';

export async function onRequest(context) {
  const { request, env, params } = context;
  const rawPath = params.path;
  const pathStr = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath || '');
  const method = request.method;
  const db = env.nav_db;
  const url = new URL(request.url);
  const q = url.searchParams;

  try {
    // ================= 1. 认证登录 (原 api/auth.js) =================
    if (pathStr === 'auth' && method === 'POST') {
      const { username, password } = await request.json();
      if (!username || !password) return json({ error: '用户名和密码不能为空' }, 400);

      const { results } = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).all();
      const user = results?.[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return json({ error: '用户名或密码错误' }, 401);
      }

      await db.prepare('UPDATE users SET last_login_time = ?, last_login_ip = ? WHERE id = ?')
        .bind(now(), clientIP(request), user.id).run();

      const token = jwt.sign({ uid: user.id, username: user.username }, env.JWT_SECRET, { expiresIn: '2h' });
      return json({ token, lastLoginTime: user.last_login_time, lastLoginIp: user.last_login_ip });
    }

    // 🔐 路由鉴权：除公开接口外，必须携带有效 Token
    const publicGetRoutes = ['card', 'menu', 'submenus', 'sub_menu', 'friends', 'ad', 'ads'];
    const isPublicGet = publicGetRoutes.includes(pathStr) && method.toUpperCase() === 'GET';
    if (!isPublicGet) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) return json({ error: '未找到认证令牌' }, 401);
      const auth = verifyToken(authHeader, env);
      if (!auth.valid) return json({ error: auth.error }, 401);
    }

    // ================= 2. 菜单管理 (原 api/menu.js) =================
    if (pathStr === 'menu') {
      if (method === 'GET') {
        try {
          // 获取所有菜单
          const { results: menus } = await db.prepare(
            'SELECT * FROM menus ORDER BY `order` ASC'
          ).all();

          // 获取所有子菜单（一次查询，性能更好）
          const { results: allSubMenus } = await db.prepare(
            'SELECT * FROM sub_menus ORDER BY `order` ASC'
          ).all();
          // 构建嵌套结构
          const menusWithSub = menus.map(menu => ({
            ...menu,
            subMenus: allSubMenus.filter(sub => sub.parent_id === menu.id)
          }));

          return json(menusWithSub);
        } catch (error) {
          console.error('Error fetching menus:', error);
          return json({ error: 'Failed to fetch menus' }, 500);
        }
      }

      if (method === 'POST') {
        const { name, order } = await request.json();
        const res = await db.prepare('INSERT INTO menus (name, "order") VALUES (?, ?)').bind(name, order || 0).run();
        return json({ id: res.meta.last_row_id }, 201);
      }
      if (method === 'PUT') {
        const id = q.get('id');
        const { name, order } = await request.json();
        const res = await db.prepare('UPDATE menus SET name = ?, "order" = ? WHERE id = ?').bind(name, order, id).run();
        return json({ changed: res.meta.changes });
      }
      if (method === 'DELETE') {
        const id = q.get('id');
        const res = await db.prepare('DELETE FROM menus WHERE id = ?').bind(id).run();
        return json({ deleted: res.meta.changes });
      }

      return json({ error: 'Method not allowed' }, 405);
    }


    // ================= 3. 子菜单 (原 api/submenus.js) =================
    if (pathStr === 'submenus' || pathStr === 'sub_menu') {
      if (method === 'GET') {
        const parentId = q.get('parentId');
        let sql = 'SELECT * FROM sub_menus';
        const params = [];
        if (parentId) { sql += ' WHERE parent_id = ?'; params.push(parentId); }
        sql += ' ORDER BY "order" ASC';
        const { results } = await db.prepare(sql).bind(...params).all();
        return json(results);
      }
      if (method === 'POST') {
        const parentId = q.get('parentId');
        const { name, order } = await request.json();
        const res = await db.prepare('INSERT INTO sub_menus (parent_id, name, "order") VALUES (?, ?, ?)')
          .bind(parentId, name, order || 0).run();
        return json({ id: res.meta.last_row_id }, 201);
      }
      if (method === 'PUT') {
        const id = q.get('id');
        const { name, order } = await request.json();
        const res = await db.prepare('UPDATE sub_menus SET name = ?, "order" = ? WHERE id = ?')
          .bind(name, order, id).run();
        return json({ changed: res.meta.changes });
      }
      if (method === 'DELETE') {
        const id = q.get('id');
        const res = await db.prepare('DELETE FROM sub_menus WHERE id = ?').bind(id).run();
        return json({ deleted: res.meta.changes });
      }
    }

    // ================= 4. 卡片管理 (原 api/card.js) =================
    if (pathStr === 'card') {
      if (method === 'GET') {
        const menuId = q.get('menuId');
        const subMenuId = q.get('subMenuId');
        let sql = 'SELECT * FROM cards WHERE ';
        const params = [];
        if (subMenuId) {
          sql += 'sub_menu_id = ? ORDER BY "order" ASC';
          params.push(subMenuId);
        } else {
          sql += 'menu_id = ? AND sub_menu_id IS NULL ORDER BY "order" ASC';
          params.push(menuId);
        }
        const { results } = await db.prepare(sql).bind(...params).all();
        return json(results);
      }
      if (method === 'POST') {
        const d = await request.json();
        const res = await db.prepare(
          'INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, "desc", "order") VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(d.menu_id ?? null, d.sub_menu_id ?? null, d.title, d.url, d.logo_url, d.desc || '', d.order || 0).run();
        return json({ id: res.meta.last_row_id }, 201);
      }
      if (method === 'PUT') {
        try {
          const id = q.get('id');
          const d = await request.json();
          const res = await db.prepare(
            'UPDATE cards SET menu_id=?, sub_menu_id=?, title=?, url=?, logo_url=?, "desc"=?, "order"=? WHERE id=?'
          ).bind(d.menu_id ?? null, d.sub_menu_id ?? null, d.title, d.url, d.logo_url, d.desc || '', d.order, id).run();
          return json({ changed: res.meta.changes });
        } catch (error) {
          console.error('Error updating card:', error);
          return json({ error: 'Failed to update card' }, 500);
        }

      }
      if (method === 'DELETE') {
        const id = q.get('id');
        const res = await db.prepare('DELETE FROM cards WHERE id = ?').bind(id).run();
        return json({ deleted: res.meta.changes });
      }
    }

    // ================= 5. 广告管理 (原 api/ad.js) =================
    if (pathStr === 'ad' || pathStr === 'ads') {
      if (method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM ads ORDER BY id ASC').all();
        return json(results);
      }
      if (method === 'POST') {
        const { position, img, url } = await request.json();
        const res = await db.prepare('INSERT INTO ads (position, img, url) VALUES (?, ?, ?)').bind(position, img, url).run();
        return json({ id: res.meta.last_row_id }, 201);
      }
      if (method === 'PUT') {
        const id = q.get('id');
        const { position, img, url } = await request.json();
        const res = await db.prepare('UPDATE ads SET position=?, img=?, url=? WHERE id=?').bind(position, img, url, id).run();
        return json({ changed: res.meta.changes });
      }
      if (method === 'DELETE') {
        const id = q.get('id');
        const res = await db.prepare('DELETE FROM ads WHERE id = ?').bind(id).run();
        return json({ deleted: res.meta.changes });
      }
    }

    // ================= 6. 友情链接 (原 api/friends.js) =================
    if (pathStr === 'friends') {
      if (method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM friends ORDER BY id ASC').all();
        return json(results);
      }
      if (method === 'POST') {
        const { title, url, logo } = await request.json();
        const res = await db.prepare('INSERT INTO friends (title, url, logo) VALUES (?, ?, ?)').bind(title, url, logo || '').run();
        return json({ id: res.meta.last_row_id }, 201);
      }
      if (method === 'PUT') {
        const id = q.get('id');
        const { title, url, logo } = await request.json();
        const res = await db.prepare('UPDATE friends SET title=?, url=?, logo=? WHERE id=?').bind(title, url, logo || '', id).run();
        return json({ changed: res.meta.changes });
      }
      if (method === 'DELETE') {
        const id = q.get('id');
        const res = await db.prepare('DELETE FROM friends WHERE id = ?').bind(id).run();
        return json({ deleted: res.meta.changes });
      }
    }

    // ================= 7. 用户中心 (原 api/user/*.js) =================
    if (pathStr === 'user/me') {
      if (method === 'GET') {
        // Token 验证已通过，解析 payload 获取当前用户
        const token = request.headers.get('Authorization').split(' ')[1];
        const payload = jwt.verify(token, env.JWT_SECRET);
        const { results } = await db.prepare('SELECT id, username, last_login_time, last_login_ip FROM users WHERE id = ?')
          .bind(payload.uid).all();
        return json(results[0] || { error: '用户不存在' }, results[0] ? 200 : 404);
      }
    }

    if (pathStr === 'user/password') {
      if (method === 'PUT') {
        const { oldPassword, newPassword } = await request.json();
        const token = request.headers.get('Authorization').split(' ')[1];
        const payload = jwt.verify(token, env.JWT_SECRET);

        const { results } = await db.prepare('SELECT password FROM users WHERE id = ?').bind(payload.uid).all();
        if (!results[0] || !(await bcrypt.compare(oldPassword, results[0].password))) {
          return json({ error: '原密码错误' }, 400);
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await db.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashed, payload.uid).run();
        return json({ success: true, message: '密码修改成功' });
      }
    }

    // ================= 8. 文件上传 (原 api/upload.js → 改为 R2) =================
    if (pathStr === 'upload' && method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file'); // 前端需传 file 字段
      if (!file) return json({ error: '未找到上传文件' }, 400);

      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // 上传至 R2 (需在 wrangler.toml 配置 r2_buckets)
      await env.NAV_R2.put(filename, file.stream(), { httpMetadata: { contentType: file.type } });

      // 返回公开访问 URL (需提前在 R2 配置自定义域名或启用公开读取)
      const publicUrl = `https://pub-xxxxx.r2.dev/${filename}`; // 替换为你的 R2 公开域名
      return json({ filename, url: publicUrl }, 201);
    }

    // ================= 兜底 =================
    return json({ error: `路由 ${method} /api/${pathStr} 不存在` }, 404);

  } catch (err) {
    console.error(`[API Error] /api/${pathStr}:`, err);
    return json({ error: '服务器内部错误', detail: process.env.NODE_ENV === 'development' ? err.message : undefined }, 500);
  }
}