const { connectToDatabase } = require('./db');

async function getUserById(userId) {
  const db = await connectToDatabase();
  const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
  return rows[0];
}

module.exports = { getUserById };