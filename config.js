// config.js - 兼容 CF Pages + D1
module.exports = {
  admin: {
    username: typeof process !== 'undefined' 
      ? (process.env.ADMIN_USERNAME || 'admin')
      : 'admin',
    password: typeof process !== 'undefined'
      ? (process.env.ADMIN_PASSWORD || '')
      : ''
  },
  server: {
    port: typeof process !== 'undefined' ? (process.env.PORT || 3000) : 3000,
    jwtSecret: typeof process !== 'undefined'
      ? (process.env.JWT_SECRET || 'nav-item-jwt-secret-cf-2024')
      : 'nav-item-jwt-secret-cf-2024'
  },
  // ✅ D1 通过 env binding 注入，不需要配置
  d1: {
    // 在 Functions 中通过 context.env.NAV_D1 访问
    bindingName: 'nav_db'
  }
};