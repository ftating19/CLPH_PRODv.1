const db = require('../dbconnection/mysql');

// Get all comments for a forum
async function getCommentsByForumId(pool, forum_id) {
  // Join users for user name display
  const [rows] = await pool.query(`
    SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) AS user_name
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.user_id
    WHERE c.forum_id = ?
    ORDER BY c.comment_id ASC
  `, [forum_id]);
  return rows;
}

// Add a comment to a forum
async function addComment(pool, { forum_id, user_id, comment }) {
  const [result] = await pool.query(
    'INSERT INTO comments (forum_id, user_id, comment) VALUES (?, ?, ?)',
    [forum_id, user_id, comment]
  );
  return result.insertId;
}

module.exports = {
  getCommentsByForumId,
  addComment
};
