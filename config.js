require('dotenv').config();

module.exports = {
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || '123456'
  },
  server: {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'nav-item-jwt-secret-2024-secure-key'
  },
  mysql: {
    host: process.env.MYSQL_HOST || '',
    user: process.env.MYSQL_USER || '',
    port: process.env.MYSQL_PORT || 3306,
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || '',
  }

}; 
