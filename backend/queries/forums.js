const db = require('../dbconnection/mysql');

// Get all forums
async function getAllForums(pool) {
  const [rows] = await pool.query('SELECT * FROM forums ORDER BY created_at DESC');
  return rows;
}

// Get forum by ID
async function getForumById(pool, forum_id) {
  const [rows] = await pool.query('SELECT * FROM forums WHERE forum_id = ?', [forum_id]);
  return rows[0];
}

// Create a new forum
async function createForum(pool, { title, topic, subject_id, created_by }) {
  const [result] = await pool.query(
    'INSERT INTO forums (title, topic, subject_id, created_by, created_at) VALUES (?, ?, ?, ?, NOW())',
    [title, topic, subject_id, created_by]
  );
  return result.insertId;
}

module.exports = {
  getAllForums,
  getForumById,
  createForum
};
