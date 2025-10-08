const { createPool } = require("mysql2/promise");
const bcrypt = require("bcrypt");
const config = require("./config");

// 创建MySQL连接池配置
const pool = createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  port: process.env.MYSQL_PORT || 3306,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function setupDatabase() {
  try {
    // 检查是否已存在表（防重复初始化）
     const tablesToCheck = ['menus', 'sub_menus', 'cards', 'users', 'ads', 'friends'];
    const allExistPromises = tablesToCheck.map(table => {
      return pool.query(`
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = ?
      `, [table]);
    });

    const results = await Promise.all(allExistPromises);
    const hasAllTables = results.every(res => res[0].length > 0);
    
    if (hasAllTables) {
      console.log("所有必要表已存在，跳过初始化");
      return;
    }

    // 1️⃣ 创建主菜单表 (menus)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        \`order\` INT DEFAULT 0 COMMENT '显示顺序'
      ) ENGINE=InnoDB;
    `);
    await pool.query("CREATE INDEX idx_menus_order ON menus(`order`);");

    // 2️⃣ 创建子菜单表 (sub_menus)，依赖 menus
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sub_menus (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        parent_id BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        \`order\` INT DEFAULT 0,
        FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    await pool.query(
      "CREATE INDEX idx_sub_menus_parent_id ON sub_menus(parent_id);"
    );
    await pool.query("CREATE INDEX idx_sub_menus_order ON sub_menus(`order`);");

    // 3️⃣ 创建卡片表 (cards)，依赖 menus 和 sub_menus
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        menu_id BIGINT,
        sub_menu_id BIGINT,
        title VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        logo_url VARCHAR(255),
        custom_logo_path VARCHAR(255),
        \`desc\` TEXT COMMENT '卡片描述',
        \`order\` INT DEFAULT 0,
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
        FOREIGN KEY (sub_menu_id) REFERENCES sub_menus(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    await pool.query("CREATE INDEX idx_cards_menu_id ON cards(menu_id);");
    await pool.query(
      "CREATE INDEX idx_cards_sub_menu_id ON cards(sub_menu_id);"
    );
    await pool.query("CREATE INDEX idx_cards_order ON cards(`order`);");

    // 4️⃣ 创建无依赖的其他表（users, ads, friends）
    await Promise.all([
      // 用户表和索引：按顺序执行
      (async () => {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        last_login_time DATETIME,
        last_login_ip VARCHAR(50)
      ) ENGINE=InnoDB;
    `);
        await pool.query("CREATE INDEX idx_users_username ON users(username);");
      })(),

      // 广告表和索引
      (async () => {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS ads (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        position VARCHAR(50) NOT NULL COMMENT '广告位名称',
        img VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);
        await pool.query("CREATE INDEX idx_ads_position ON ads(position);");
      })(),

      // 友链表和索引
      (async () => {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        logo VARCHAR(255)
      ) ENGINE=InnoDB;
    `);
        await pool.query("CREATE INDEX idx_friends_title ON friends(title);");
      })(),
    ]);

    // 继续初始化默认数据
    console.log('开始初始化数据......');
    await initializeDefaults();
  } catch (error) {
    console.error("数据库初始化失败:", error);
    process.exit(1);
  }
}

// 启动数据库初始化（应用启动时自动触发）
setupDatabase();

async function initializeDefaults() {
  // =====================================================================================
  // 初始化默认数据（按依赖顺序插入）
  // =====================================================================================

  // 1️⃣ 主菜单初始化
  const hasMenus = await tableNotEmpty("menus");
  if (!hasMenus) {
    const defaultMenus = [
      ["Home", 1],
      ["Ai Stuff", 2],
      ["Cloud", 3],
      ["Software", 4],
      ["Tools", 5],
      ["Other", 6],
    ];
    await Promise.all(
      defaultMenus.map((item) =>
        pool.query("INSERT INTO menus (name, `order`) VALUES (?,?)", item)
      )
    );
  }
  console.log('主菜单初始化完毕......');

  // 2️⃣ 子菜单初始化
  const hasSubMenus = await tableNotEmpty("sub_menus");
  if (!hasSubMenus) {
    const subs = [
      { parentId: await getMenuId("Ai Stuff"), name: "AI chat", order: 1 },
      { parentId: await getMenuId("Ai Stuff"), name: "AI tools", order: 2 },
      { parentId: await getMenuId("Tools"), name: "Dev Tools", order: 1 },
      { parentId: await getMenuId("Software"), name: "Mac", order: 1 },
      { parentId: await getMenuId("Software"), name: "iOS", order: 2 },
      { parentId: await getMenuId("Software"), name: "Android", order: 3 },
      { parentId: await getMenuId("Software"), name: "Windows", order: 4 },
    ];
    await Promise.all(
      subs.map((sub) =>
        pool.query(
          "INSERT INTO sub_menus (parent_id, name, `order`) VALUES (?,?,?)",
          [sub.parentId, sub.name, sub.order]
        )
      )
    );
  }
  console.log('子菜单初始化完毕......');

  // 3️⃣ 卡片初始化
  const homeMenuId = await getMenuId("Home");
  const hasCards = await tableNotEmpty("cards");
  if (!hasCards) {
    await Promise.all([
      pool.query(
        "INSERT INTO cards (menu_id, title, url, logo_url, `desc`, `order`) " +
          "VALUES (?,?,?,?,?,0)",
        [
          homeMenuId,
          "Baidu",
          "https://www.baidu.com",
          "",
          "全球最大的中文搜索引擎",
        ]
      ),
      pool.query(
        "INSERT INTO cards (menu_id, title, url, logo_url, `desc`, `order`) " +
          "VALUES (?,?,?,?,?,0)",
        [
          homeMenuId,
          "YouTube",
          "https://www.youtube.com",
          "https://img.icons8.com/ios-filled/100/ff1d06/youtube-play.png",
          "全球最大的视频社区",
        ]
      ),
      pool.query(
        "INSERT INTO cards (menu_id, title, url, logo_url, `desc`, `order`) " +
          "VALUES (?,?,?,?,?,0)",
        [
          homeMenuId,
          "Gmail",
          "https://mail.google.com",
          "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
          "Gmail快速入口",
        ]
      ),
      pool.query(
        "INSERT INTO cards (menu_id, title, url, logo_url, `desc`, `order`) " +
          "VALUES (?,?,?,?,?,0)",
        [
          await getMenuId("Other"),
          "10分钟临时邮箱",
          "https://linshiyouxiang.net",
          "https://linshiyouxiang.net/static/index/zh/images/favicon.ico",
          "临时邮箱服务",
        ]
      ),
    ]);
  }
  console.log('卡片初始化完毕......');

  // 4️⃣ 管理员账号
  const hasUsers = await tableNotEmpty("users");
  if (!hasUsers && config.admin) {
    // 假设 config.admin 包含账号配置
    const hashedPass = await bcrypt.hash(config.admin.password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES (?, ?)", [
      config.admin.username,
      hashedPass,
    ]);
  }
  console.log('账号初始化完毕......');

  // 5️⃣ 友情链接
  const hasFriends = await tableNotEmpty("friends");
  if (!hasFriends) {
    await pool.query(`
      INSERT INTO friends (title, url, logo) VALUES 
      ('Noodseek图床', 'https://www.nodeimage.com', 'https://www.nodeseek.com/static/image/favicon/favicon-32x32.png'),
      ('Font Awesome', 'https://fontawesome.com', 'https://fontawesome.com/favicon.ico')
    `);
  }
}

async function tableNotEmpty(table) {
  try {
    const [rows] = await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
    return rows.length > 0;
  } catch (e) {
    return false;
  }
}

async function getMenuId(name) {
  let menuId;
  const [rows] = await pool.query("SELECT id FROM menus WHERE name = ?", [
    name,
  ]);
  if (rows.length === 0) {
    const [result] = await pool.query("INSERT INTO menus (name) VALUES (?)", [
      name,
    ]);
    menuId = result.insertId;
  } else {
    menuId = rows[0].id;
  }
  return menuId;
}

module.exports = pool;

