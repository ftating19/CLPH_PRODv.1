// Study Materials database queries

// Get all study materials (learning resources)
const getAllStudyMaterials = async (pool) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        sm.*,
        u.first_name,
        u.last_name
      FROM studymaterials sm
      LEFT JOIN users u ON sm.uploaded_by = u.user_id
      WHERE sm.status = 'active'
      ORDER BY sm.material_id DESC
    `);
    
    return rows.map(row => ({
      ...row,
      uploaded_by_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown User'
    }));
  } catch (error) {
    console.error('Error fetching study materials:', error);
    throw error;
  }
};

// Get study material by ID
const getStudyMaterialById = async (pool, materialId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        sm.*,
        u.first_name,
        u.last_name
      FROM studymaterials sm
      LEFT JOIN users u ON sm.uploaded_by = u.user_id
      WHERE sm.material_id = ? AND sm.status = 'active'
    `, [materialId]);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      ...row,
      uploaded_by_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown User'
    };
  } catch (error) {
    console.error('Error fetching study material:', error);
    throw error;
  }
};

// Create new study material
const createStudyMaterial = async (pool, materialData) => {
  try {
    const {
      title,
      description,
      file_path,
      uploaded_by,
      file_type
    } = materialData;

    const [result] = await pool.query(`
      INSERT INTO studymaterials (
        title, description, file_path, uploaded_by, status, 
        download_count, rating, file_type, view_count
      ) VALUES (?, ?, ?, ?, 'active', 0, 0, ?, 0)
    `, [
      title,
      description || null,
      file_path,
      uploaded_by,
      file_type || 'PDF'
    ]);

    return {
      material_id: result.insertId,
      ...materialData,
      status: 'active',
      download_count: 0,
      rating: 0,
      view_count: 0
    };
  } catch (error) {
    console.error('Error creating study material:', error);
    throw error;
  }
};

// Update study material
const updateStudyMaterial = async (pool, materialId, materialData) => {
  try {
    const {
      title,
      description
    } = materialData;

    const [result] = await pool.query(`
      UPDATE studymaterials 
      SET title = ?, description = ?
      WHERE material_id = ?
    `, [title, description, materialId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating study material:', error);
    throw error;
  }
};

// Delete study material (soft delete)
const deleteStudyMaterial = async (pool, materialId) => {
  try {
    const [result] = await pool.query(`
      UPDATE studymaterials 
      SET status = 'deleted' 
      WHERE material_id = ?
    `, [materialId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting study material:', error);
    throw error;
  }
};

// Increment download count
const incrementDownloadCount = async (pool, materialId) => {
  try {
    const [result] = await pool.query(`
      UPDATE studymaterials 
      SET download_count = download_count + 1 
      WHERE material_id = ?
    `, [materialId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error incrementing download count:', error);
    throw error;
  }
};

// Increment view count
const incrementViewCount = async (pool, materialId) => {
  try {
    const [result] = await pool.query(`
      UPDATE studymaterials 
      SET view_count = view_count + 1 
      WHERE material_id = ?
    `, [materialId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    throw error;
  }
};

// Update rating
const updateMaterialRating = async (pool, materialId, rating) => {
  try {
    const [result] = await pool.query(`
      UPDATE studymaterials 
      SET rating = ? 
      WHERE material_id = ?
    `, [rating, materialId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating material rating:', error);
    throw error;
  }
};

// Search study materials
const searchStudyMaterials = async (pool, searchTerm) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        sm.*,
        u.first_name,
        u.last_name
      FROM studymaterials sm
      LEFT JOIN users u ON sm.uploaded_by = u.user_id
      WHERE sm.status = 'active' 
        AND (sm.title LIKE ? OR sm.description LIKE ?)
      ORDER BY sm.material_id DESC
    `, [`%${searchTerm}%`, `%${searchTerm}%`]);
    
    return rows.map(row => ({
      ...row,
      uploaded_by_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown User'
    }));
  } catch (error) {
    console.error('Error searching study materials:', error);
    throw error;
  }
};

module.exports = {
  getAllStudyMaterials,
  getStudyMaterialById,
  createStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial,
  incrementDownloadCount,
  incrementViewCount,
  updateMaterialRating,
  searchStudyMaterials
};
