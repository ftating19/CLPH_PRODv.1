// queries/users.js
// Export functions related to users table queries.
async function createUser(pool, { first_name, middle_name, last_name, email, password, program, role, status, year_level, first_login }) {
  const [result] = await pool.query(
    'INSERT INTO users (first_name, middle_name, last_name, email, password, program, role, status, year_level, first_login, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [first_name, middle_name || null, last_name, email, password, program || null, role || 'Student', status || 'Active', year_level || null, first_login !== undefined ? first_login : 1]
  )
  return result
}

async function findUserByEmail(pool, email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function updateUser(pool, userId, userData) {
  const { first_name, middle_name, last_name, email, program, role, status, year_level } = userData;
  
  const [result] = await pool.query(
    `UPDATE users SET 
      first_name = ?, 
      middle_name = ?, 
      last_name = ?, 
      email = ?, 
      program = ?, 
      role = ?, 
      status = ?,
      year_level = ?
    WHERE user_id = ?`,
    [first_name, middle_name || null, last_name, email, program, role, status, year_level || null, userId]
  );
  
  return result;
}

async function findUserById(pool, userId) {
  const [rows] = await pool.query(
    'SELECT user_id, first_name, middle_name, last_name, email, program, role, status, year_level FROM users WHERE user_id = ?',
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

module.exports = { createUser, findUserByEmail, updateUser, findUserById };
