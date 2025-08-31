const db = require('../dbconnection/mysql');

// Get all forums
async function getAllForums(pool) {
  // Join users and subjects for display, and add comment count
  const [rows] = await pool.query(`
    SELECT f.*, 
      CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
      s.subject_name,
      (
        SELECT COUNT(*) FROM comments c WHERE c.forum_id = f.forum_id
      ) AS comment_count
    FROM forums f
    LEFT JOIN users u ON f.created_by = u.user_id
    LEFT JOIN subjects s ON f.subject_id = s.subject_id
    ORDER BY f.created_at DESC
  `);
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
