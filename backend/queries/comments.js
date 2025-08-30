const db = require('../dbconnection/mysql');

// Get all comments for a forum
async function getCommentsByForumId(pool, forum_id) {
  const [rows] = await pool.query('SELECT * FROM comments WHERE forum_id = ? ORDER BY comment_id ASC', [forum_id]);
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
