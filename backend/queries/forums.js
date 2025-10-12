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
      ) AS comment_count,
      f.updated_at,
      CASE 
        WHEN f.updated_at IS NOT NULL AND f.updated_at > f.created_at THEN 1
        ELSE 0
      END AS is_edited
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

// Update a forum
async function updateForum(pool, forum_id, { title, topic, subject_id }) {
  const [result] = await pool.query(
    'UPDATE forums SET title = ?, topic = ?, subject_id = ?, updated_at = NOW() WHERE forum_id = ?',
    [title, topic, subject_id, forum_id]
  );
  return result.affectedRows > 0;
}

// Delete a forum
async function deleteForum(pool, forum_id) {
  // First delete all comments associated with this forum
  await pool.query('DELETE FROM comments WHERE forum_id = ?', [forum_id]);
  // Delete all likes associated with this forum
  await pool.query('DELETE FROM forum_likes WHERE forum_id = ?', [forum_id]);
  // Finally delete the forum
  const [result] = await pool.query('DELETE FROM forums WHERE forum_id = ?', [forum_id]);
  return result.affectedRows > 0;
}


// Check if user liked forum
async function hasUserLiked(pool, forum_id, user_id) {
  const [rows] = await pool.query('SELECT 1 FROM forum_likes WHERE forum_id = ? AND user_id = ?', [forum_id, user_id]);
  return rows.length > 0;
}

// Add user like
async function addUserLike(pool, forum_id, user_id) {
  await pool.query('INSERT IGNORE INTO forum_likes (forum_id, user_id) VALUES (?, ?)', [forum_id, user_id]);
  await pool.query('UPDATE forums SET like_count = COALESCE(like_count, 0) + 1 WHERE forum_id = ?', [forum_id]);
}

// Remove user like
async function removeUserLike(pool, forum_id, user_id) {
  await pool.query('DELETE FROM forum_likes WHERE forum_id = ? AND user_id = ?', [forum_id, user_id]);
  await pool.query('UPDATE forums SET like_count = GREATEST(COALESCE(like_count, 1) - 1, 0) WHERE forum_id = ?', [forum_id]);
}

module.exports = {
  getAllForums,
  getForumById,
  createForum,
  updateForum,
  deleteForum,
  hasUserLiked,
  addUserLike,
  removeUserLike
};
