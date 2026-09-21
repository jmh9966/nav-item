// setup-local-db.js
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');

(async () => {
  execSync('npx wrangler d1 execute nav-db --remote --command="DROP TABLE IF EXISTS cards; DROP TABLE IF EXISTS sub_menus; DROP TABLE IF EXISTS friends; DROP TABLE IF EXISTS ads; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS menus;"', { stdio: 'inherit' });
  execSync('npx wrangler d1 execute nav-db --remote --file=./migrations/schema.sql', { stdio: 'inherit' });
  const password = '1346'; // 你的管理员密码
  const hash = await bcrypt.hash(password, 10);
  
  console.log(`✅ 生成哈希: ${hash}`);
  
  // 用 --file 方式执行，避免转义问题
  const sql = `UPDATE users SET password = '${hash}' WHERE id = 1;`;
  require('fs').writeFileSync('.temp_update.sql', sql);
  
  execSync('npx wrangler d1 execute nav-db --local --file=.temp_update.sql', { stdio: 'inherit' });
  
  // 清理临时文件
  require('fs').unlinkSync('.temp_update.sql');
  
  console.log('✅ 管理员密码已更新，尝试登录测试:');
  console.log(`curl -X POST http://127.0.0.1:8788/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"${password}"}'`);


  // 初始化数据
})();