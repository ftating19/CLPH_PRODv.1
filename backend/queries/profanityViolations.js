const db = require('../dbconnection/mysql');

/**
 * Log a profanity violation attempt
 * @param {object} pool - Database connection pool
 * @param {object} violationData - Violation data
 * @returns {Promise<number>} - The ID of the created violation log
 */
async function logProfanityViolation(pool, violationData) {
  const {
    user_id,
    context_type = 'general',
    context_id = null,
    attempted_content,
    detected_words = [],
    user_ip = null,
    user_agent = null,
    severity = 'medium'
  } = violationData;

  const [result] = await pool.query(`
    INSERT INTO profanity_violations (
      user_id, context_type, context_id, attempted_content, 
      detected_words, user_ip, user_agent, severity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    user_id,
    context_type,
    context_id,
    attempted_content,
    JSON.stringify(detected_words),
    user_ip,
    user_agent,
    severity
  ]);

  return result.insertId;
}

/**
 * Get profanity violations for a specific user
 * @param {object} pool - Database connection pool
 * @param {number} user_id - User ID
 * @param {number} limit - Number of records to retrieve
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of violation records
 */
async function getUserViolations(pool, user_id, limit = 50, offset = 0) {
  const [rows] = await pool.query(`
    SELECT pv.*, 
           CONCAT(u.first_name, ' ', u.last_name) AS user_name,
           u.email AS user_email
    FROM profanity_violations pv
    LEFT JOIN users u ON pv.user_id = u.user_id
    WHERE pv.user_id = ?
    ORDER BY pv.violation_timestamp DESC
    LIMIT ? OFFSET ?
  `, [user_id, limit, offset]);

  // Parse JSON detected_words field
  return rows.map(row => ({
    ...row,
    detected_words: JSON.parse(row.detected_words || '[]')
  }));
}

/**
 * Get all profanity violations (for admin monitoring)
 * @param {object} pool - Database connection pool
 * @param {number} limit - Number of records to retrieve
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of violation records
 */
async function getAllViolations(pool, limit = 50, offset = 0) {
  const [rows] = await pool.query(`
    SELECT pv.*, 
           CONCAT(u.first_name, ' ', u.last_name) AS user_name,
           u.email AS user_email
    FROM profanity_violations pv
    LEFT JOIN users u ON pv.user_id = u.user_id
    ORDER BY pv.violation_timestamp DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  // Parse JSON detected_words field
  return rows.map(row => ({
    ...row,
    detected_words: JSON.parse(row.detected_words || '[]')
  }));
}

/**
 * Get violation count for a user
 * @param {object} pool - Database connection pool
 * @param {number} user_id - User ID
 * @param {string} timeframe - Time frame for counting ('day', 'week', 'month', 'all')
 * @returns {Promise<number>} - Number of violations
 */
async function getUserViolationCount(pool, user_id, timeframe = 'all') {
  let whereClause = 'WHERE user_id = ?';
  let params = [user_id];

  if (timeframe !== 'all') {
    switch (timeframe) {
      case 'day':
        whereClause += ' AND violation_timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
        break;
      case 'week':
        whereClause += ' AND violation_timestamp >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
        break;
      case 'month':
        whereClause += ' AND violation_timestamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        break;
    }
  }

  const [rows] = await pool.query(`
    SELECT COUNT(*) as violation_count 
    FROM profanity_violations 
    ${whereClause}
  `, params);

  return rows[0].violation_count;
}

/**
 * Get top violators (for admin monitoring)
 * @param {object} pool - Database connection pool
 * @param {number} limit - Number of top violators to return
 * @param {string} timeframe - Time frame for counting ('day', 'week', 'month', 'all')
 * @returns {Promise<Array>} - Array of users with violation counts
 */
async function getTopViolators(pool, limit = 10, timeframe = 'month') {
  let whereClause = '';
  if (timeframe !== 'all') {
    switch (timeframe) {
      case 'day':
        whereClause = 'WHERE pv.violation_timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
        break;
      case 'week':
        whereClause = 'WHERE pv.violation_timestamp >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
        break;
      case 'month':
        whereClause = 'WHERE pv.violation_timestamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        break;
    }
  }

  const [rows] = await pool.query(`
    SELECT pv.user_id,
           CONCAT(u.first_name, ' ', u.last_name) AS user_name,
           u.email AS user_email,
           COUNT(*) as violation_count,
           MAX(pv.violation_timestamp) as latest_violation
    FROM profanity_violations pv
    LEFT JOIN users u ON pv.user_id = u.user_id
    ${whereClause}
    GROUP BY pv.user_id, u.first_name, u.last_name, u.email
    ORDER BY violation_count DESC
    LIMIT ?
  `, [limit]);

  return rows;
}

/**
 * Delete old violation records (for data cleanup)
 * @param {object} pool - Database connection pool
 * @param {number} daysToKeep - Number of days to keep records
 * @returns {Promise<number>} - Number of records deleted
 */
async function cleanupOldViolations(pool, daysToKeep = 365) {
  const [result] = await pool.query(`
    DELETE FROM profanity_violations 
    WHERE violation_timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
  `, [daysToKeep]);

  return result.affectedRows;
}

module.exports = {
  logProfanityViolation,
  getUserViolations,
  getAllViolations,
  getUserViolationCount,
  getTopViolators,
  cleanupOldViolations
};