const express = require("express");
const dbPool = require("../db"); // 使用连接池
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // 假设配置为使用 bcryptjs
const config = require("../config");
const router = express.Router();

// 配置密钥（建议从环境变量获取）
const JWT_SECRET = config.server.jwtSecret;

// 获取客户端IP
function getClientIp(req) {
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "";
  if (typeof ip === "string" && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  if (typeof ip === "string" && ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  return ip;
}

// 获取上海标准时间
function getShanghaiTime() {
  const date = new Date();
  const shanghaiTime = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
  );
  const y = shanghaiTime.getFullYear();
  const m = String(shanghaiTime.getMonth() + 1).padStart(2, "0");
  const d = String(shanghaiTime.getDate()).padStart(2, "0");
  const h = String(shanghaiTime.getHours()).padStart(2, "0");
  const min = String(shanghaiTime.getMinutes()).padStart(2, "0");
  const s = String(shanghaiTime.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

// 登录接口
router.post("/login", async (req, res) => {
  try {
    // 解析请求参数
    const { username, password } = req.body;

    // 查询用户信息
    const [rows] = await dbPool.query(
      `SELECT id, username, password, last_login_time, last_login_ip 
       FROM users 
       WHERE username = ?`,
      [username]
    );
    const user = rows[0];

    // 验证用户存在性
    if (!user) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 使用bcrypt验证密码 (处理异步)
    const isPasswordValid = await new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (!isPasswordValid) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 获取当前登录信息
    const ip = getClientIp(req);
    const now = getShanghaiTime();

    // 更新登录记录（使用事务保证数据一致性）
    try {
      // 获取数据库连接
      const connection = await dbPool.getConnection();

      try {
        // 开始事务
        await connection.beginTransaction();

        // 更新登录信息
        await connection.query(
          `UPDATE users 
       SET last_login_time = ?, 
           last_login_ip = ? 
       WHERE id = ?`,
          [now, ip, user.id]
        );

        // 额外：记录登录日志
        /* await connection.query(
      'INSERT INTO login_logs SET ?',
      { user_id: user.id, ip, time: now }
    ); */

        // 提交事务
        await connection.commit();
      } catch (err) {
        // 回滚事务
        await connection.rollback();
        throw err;
      } finally {
        // 释放连接回连接池
        connection.release();
      }
    } catch (error) {
      console.error("登录失败，事务处理异常:", error);
      if (error.message.includes("事务")) {
        return res.status(500).json({ error: "登录记录失败，请重试" });
      }
      throw error; // 交由全局错误处理
    }

    // 生成JWT token
    const token = jwt.sign(
      { uid: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // 返回响应数据
    return res.json({
      token,
      lastLoginTime: user.last_login_time || null,
      lastLoginIp: user.last_login_ip || null,
    });
  } catch (error) {
    // 错误处理
    console.error("Login fail:", error);
    if (error.message.includes("bcrypt")) {
      return res.status(401).json({ error: "密码验证失败" });
    }
    res.status(500).json({ error: "服务器错误，请重试" });
  }
});

module.exports = router;
