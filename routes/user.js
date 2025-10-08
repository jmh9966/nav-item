const express = require("express");
const bcrypt = require("bcryptjs"); // 使用异步函数版本
const dbPool = require("../db");
const authMiddleware = require("./authMiddleware");
const router = express.Router();

// 自定义错误处理
async function handleError(res, err, customMessage = "服务器内部错误") {
  if (err.message?.includes("bcrypt")) {
    return res.status(400).json({ error: "密码验证失败" });
  }
  console.error(err);
  return res.status(500).json({ error: customMessage });
}

// 从数据库获取用户
// getUserById 函数
async function getUserById(userId) {
  try {
    console.log(`正在查询用户: ID=${userId}, 类型=${typeof userId}`);

    const [rows] = await dbPool.query(`SELECT * FROM users WHERE id = ?`, [
      userId,
    ]);

    const user = rows[0];

    return user;
  } catch (error) {
    console.error("数据库查询异常:", error);
    throw new Error("数据库操作失败");
  }
}

// 获取当前用户基本信息
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    // 日志打印
    console.log(`查询用户：req.user`, req.user?.id);

    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "用户不存在或令牌已失效" });
    }

    // 仅返回敏感字段
    res.json({
      id: user.id,
      username: user.username,
      // 过滤其他敏感字段如 password
    });
  } catch (err) {
    return res.status(500).json({ error: "无法获取用户信息" });
  }
});

// 获取当前用户详细信息（包括登录记录）
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [userRow] = await dbPool.query(
      `
      SELECT 
        id, username, 
        last_login_time, 
        last_login_ip
      FROM users 
      WHERE id = ?
    `,
      [req.user.id]
    );

    if (userRow.length === 0) {
      return res.status(404).json({ error: "用户不存在" });
    }

    const user = userRow[0];
    return res.json({
      last_login_time: user.last_login_time,
      last_login_ip: user.last_login_ip,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// 修改密码
router.put("/password", authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "请提供旧密码和新密码" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "新密码至少需要6位" });
  }

  // 1. 验证用户是否存在
  const user = await getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "用户不存在" });
  }

  // 2. 验证旧密码
  const validOld = await bcrypt.compare(oldPassword, user.password);
  if (!validOld) {
    return res.status(400).json({ error: "旧密码错误" });
  }

  // 3. 更新密码
  const newHash = bcrypt.hashSync(newPassword, 10);
  await dbPool.query("UPDATE users SET password = ? WHERE id = ?", [newHash, req.user.id]);
  res.json({ success: true, message: "密码更新成功" });
});

// 获取所有用户（仅限管理员）
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    let total,
      pageNum = 1,
      size = 10;

    // 页码处理
    if (page && pageSize) {
      pageNum = parseInt(page, 10) || 1;
      size = parseInt(pageSize, 10) || 10;
    }

    // 计算偏移量
    const offset = (pageNum - 1) * size;

    // 查询总记录数
    const [totalResult] = await dbPool.query(
      "SELECT COUNT(*) AS total FROM users"
    );
    total = totalResult[0].total;

    // 获取页码数据
    const [userRows] = await dbPool.query(
      `
      SELECT id, username FROM users
      LIMIT ? OFFSET ?
    `,
      [size, offset]
    );

    // 自动合并所有数据当无分页参数时
    if (!page && !pageSize) {
      pageNum = 1;
      size = userRows.length; // 返回全部时保持数据一致性
    }

    return res.json({
      total,
      page: pageNum,
      pageSize: size,
      data: userRows,
    });
  } catch (err) {
    handleError(res, err, "获取用户列表失败");
  }
});

module.exports = router;
