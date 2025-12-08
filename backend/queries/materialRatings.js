// Material ratings database queries

// Get average rating for a material
const getMaterialAverageRating = async (pool, materialId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_ratings
      FROM material_ratings
      WHERE material_id = ?
    `, [materialId]);
    
    return {
      average_rating: parseFloat(parseFloat(rows[0].average_rating).toFixed(1)),
      total_ratings: rows[0].total_ratings
    };
  } catch (error) {
    console.error('Error fetching material average rating:', error);
    throw error;
  }
};

// Get user's rating for a material
const getUserMaterialRating = async (pool, materialId, userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT rating, comment, created_at, updated_at
      FROM material_ratings
      WHERE material_id = ? AND user_id = ?
    `, [materialId, userId]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching user material rating:', error);
    throw error;
  }
};

// Create or update material rating
const upsertMaterialRating = async (pool, materialId, userId, rating, comment = null) => {
  try {
    const [result] = await pool.query(`
      INSERT INTO material_ratings (material_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        rating = VALUES(rating),
        comment = VALUES(comment),
        updated_at = CURRENT_TIMESTAMP
    `, [materialId, userId, rating, comment]);

    return result;
  } catch (error) {
    console.error('Error upserting material rating:', error);
    throw error;
  }
};

// Delete user rating
const deleteMaterialRating = async (pool, materialId, userId) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM material_ratings
      WHERE material_id = ? AND user_id = ?
    `, [materialId, userId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting material rating:', error);
    throw error;
  }
};

// Get all ratings and comments for a material
const getMaterialRatingsWithComments = async (pool, materialId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        mr.rating_id,
        mr.rating,
        mr.comment,
        mr.created_at,
        mr.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM material_ratings mr
      JOIN users u ON mr.user_id = u.user_id
      WHERE mr.material_id = ?
      ORDER BY mr.updated_at DESC
    `, [materialId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching material ratings with comments:', error);
    throw error;
  }
};

module.exports = {
  getMaterialAverageRating,
  getUserMaterialRating,
  upsertMaterialRating,
  deleteMaterialRating,
  getMaterialRatingsWithComments
};