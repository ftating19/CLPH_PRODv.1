// Pending Materials database queries
const path = require('path');
const fs = require('fs');

// Get all pending materials
const getAllPendingMaterials = async (pool) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pm.material_id,
        pm.title,
        pm.description,
        pm.file_path,
        pm.uploaded_by,
        pm.status,
        pm.download_count,
        pm.rating,
        pm.file_type,
        pm.view_count,
        pm.subject,
        pm.file_size,
        pm.reviewed_by,
        pm.reviewed_at,
        pm.program,
        CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        s.user_id as subject_user_ids,
        s.subject_code,
        s.subject_name
      FROM pendingmaterials pm
      LEFT JOIN users u ON pm.uploaded_by = u.user_id
      LEFT JOIN users r ON pm.reviewed_by = r.user_id
      LEFT JOIN subjects s ON pm.subject = s.subject_name
      ORDER BY pm.material_id DESC
    `);
    // Get all faculty for mapping
    const [faculty] = await pool.query('SELECT user_id, first_name, middle_name, last_name, email FROM users WHERE role = "Faculty"');
    // Attach assigned_faculty array to each material
    return rows.map(row => {
      let assigned_faculty = [];
      if (row.subject_user_ids) {
        try {
          const ids = JSON.parse(row.subject_user_ids);
          assigned_faculty = ids.map(fid => {
            const fac = faculty.find(f => String(f.user_id) === String(fid));
            return fac ? `${fac.first_name} ${fac.middle_name ? fac.middle_name + ' ' : ''}${fac.last_name} (${fac.email})` : `Faculty ID: ${fid}`;
          });
        } catch {
          assigned_faculty = [];
        }
      }
      return { ...row, assigned_faculty };
    });
  } catch (error) {
    console.error('Error fetching pending materials:', error);
    throw error;
  }
};

// Get pending material by ID
const getPendingMaterialById = async (pool, materialId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pm.material_id,
        pm.title,
        pm.description,
        pm.file_path,
        pm.uploaded_by,
        pm.status,
        pm.download_count,
        pm.rating,
        pm.file_type,
        pm.view_count,
        pm.subject,
        pm.file_size,
        pm.reviewed_by,
        pm.reviewed_at,
        pm.program,
        CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        u.email
      FROM pendingmaterials pm
      LEFT JOIN users u ON pm.uploaded_by = u.user_id
      LEFT JOIN users r ON pm.reviewed_by = r.user_id
      WHERE pm.material_id = ?
    `, [materialId]);
    
    if (rows.length === 0) return null;
    
    return rows[0];
  } catch (error) {
    console.error('Error fetching pending material:', error);
    throw error;
  }
};

// Create new pending material
const createPendingMaterial = async (pool, materialData) => {
  try {
    const {
      title,
      description,
      file_path,
      uploaded_by,
      file_type,
      subject,
      file_size,
      program
    } = materialData;

    const [result] = await pool.query(`
      INSERT INTO pendingmaterials (
        title, 
        description, 
        file_path, 
        uploaded_by, 
        status, 
        download_count, 
        rating, 
        file_type, 
        view_count, 
        subject, 
        file_size,
        program
      ) VALUES (?, ?, ?, ?, 'pending', 0, 0, ?, 0, ?, ?, ?)
    `, [
      title,
      description || null,
      file_path,
      uploaded_by,
      file_type || 'PDF',
      subject || 'General',
      file_size || 0,
      program || null
    ]);

    return {
      material_id: result.insertId,
      title,
      description,
      file_path,
      uploaded_by,
      status: 'pending',
      download_count: 0,
      rating: 0,
      file_type: file_type || 'PDF',
      view_count: 0,
      subject: subject || 'General',
      file_size: file_size || 0,
      program: program || null
    };
  } catch (error) {
    console.error('Error creating pending material:', error);
    throw error;
  }
};

// Update pending material status
const updatePendingMaterialStatus = async (pool, materialId, status, reviewedBy = null) => {
  try {
    const [result] = await pool.query(`
      UPDATE pendingmaterials 
      SET status = ?, reviewed_by = ?, reviewed_at = NOW()
      WHERE material_id = ?
    `, [status, reviewedBy, materialId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating pending material status:', error);
    throw error;
  }
};

// Delete pending material
const deletePendingMaterial = async (pool, materialId) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM pendingmaterials WHERE material_id = ?
    `, [materialId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting pending material:', error);
    throw error;
  }
};

// Get pending materials by status
const getPendingMaterialsByStatus = async (pool, status) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pm.material_id,
        pm.title,
        pm.description,
        pm.file_path,
        pm.uploaded_by,
        pm.status,
        pm.download_count,
        pm.rating,
        pm.file_type,
        pm.view_count,
        pm.subject,
        pm.file_size,
        pm.reviewed_by,
        pm.reviewed_at,
        pm.program,
        CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name,
        CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name,
        s.user_id as subject_user_ids,
        s.subject_code,
        s.subject_name
      FROM pendingmaterials pm
      LEFT JOIN users u ON pm.uploaded_by = u.user_id
      LEFT JOIN users r ON pm.reviewed_by = r.user_id
      LEFT JOIN subjects s ON pm.subject = s.subject_name
      WHERE pm.status = ?
      ORDER BY pm.material_id DESC
    `, [status]);
    const [faculty] = await pool.query('SELECT user_id, first_name, middle_name, last_name, email FROM users WHERE role = "Faculty"');
    return rows.map(row => {
      let assigned_faculty = [];
      if (row.subject_user_ids) {
        try {
          const ids = JSON.parse(row.subject_user_ids);
          assigned_faculty = ids.map(fid => {
            const fac = faculty.find(f => String(f.user_id) === String(fid));
            return fac ? `${fac.first_name} ${fac.middle_name ? fac.middle_name + ' ' : ''}${fac.last_name} (${fac.email})` : `Faculty ID: ${fid}`;
          });
        } catch {
          assigned_faculty = [];
        }
      }
      return { ...row, assigned_faculty };
    });
  } catch (error) {
    console.error('Error fetching pending materials by status:', error);
    throw error;
  }
};

// Transfer approved material to studymaterials table
const transferToStudyMaterials = async (pool, pendingMaterial) => {
  try {
    const {
      title,
      description,
      file_path,
      uploaded_by,
      file_type,
      subject,
      file_size,
      program
    } = pendingMaterial;

    console.log('=== TRANSFER TO STUDY MATERIALS DEBUG ===');
    console.log('Pending Material Program:', program);
    console.log('Full Pending Material:', pendingMaterial);
    console.log('==========================================');

    // Create new file path for learning resources
    const filename = path.basename(file_path);
    const newFilePath = `/learning-resources/${filename}`;

    const [result] = await pool.query(`
      INSERT INTO studymaterials (
        title, 
        description, 
        file_path, 
        uploaded_by, 
        status, 
        download_count, 
        rating, 
        file_type, 
        view_count, 
        subject, 
        file_size,
        program
      ) VALUES (?, ?, ?, ?, 'active', 0, 0, ?, 0, ?, ?, ?)
    `, [
      title,
      description || null,
      newFilePath,
      uploaded_by,
      file_type || 'PDF',
      subject || 'General',
      file_size || 0,
      program || null
    ]);

    return {
      material_id: result.insertId,
      title,
      description,
      file_path: newFilePath,
      uploaded_by,
      status: 'active',
      download_count: 0,
      rating: 0,
      file_type: file_type || 'PDF',
      view_count: 0,
      subject: subject || 'General',
      file_size: file_size || 0,
      program: program || null
    };
  } catch (error) {
    console.error('Error transferring to study materials:', error);
    throw error;
  }
};

module.exports = {
  getAllPendingMaterials,
  getPendingMaterialById,
  createPendingMaterial,
  updatePendingMaterialStatus,
  deletePendingMaterial,
  getPendingMaterialsByStatus,
  transferToStudyMaterials
};
