// lib/db.js
const mysql = require('mysql2/promise');
const config = require('../config');

let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const connection = await mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    port: config.mysql.port ? parseInt(config.mysql.port, 10) : 3306,
  });

  cachedConnection = connection;
  return connection;
}

module.exports = { connectToDatabase };
