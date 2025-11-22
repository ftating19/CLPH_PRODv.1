// Require dotenv to load environment variables
require('dotenv').config({ path: './.env' });

const db = require('./dbconnection/mysql');

async function applyMigration() {
  try {
    console.log('Connecting to database...');
    await db.connect();
    const pool = db.getPool();
    
    console.log('Running migration: Add class_card_image_url column...');
    
    // Check if column already exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'tutorapplications' 
      AND COLUMN_NAME = 'class_card_image_url'
    `);
    
    if (columns.length > 0) {
      console.log('✓ Column class_card_image_url already exists');
    } else {
      // Add the column
      await pool.query(`
        ALTER TABLE tutorapplications 
        ADD COLUMN class_card_image_url VARCHAR(500) NULL AFTER specialties
      `);
      console.log('✓ Column class_card_image_url added');
      
      // Create index
      try {
        await pool.query(`
          CREATE INDEX idx_tutorapplications_image ON tutorapplications(class_card_image_url)
        `);
        console.log('✓ Index created');
      } catch (indexErr) {
        console.log('Note: Index may already exist or couldn\'t be created:', indexErr.message);
      }
    }
    
    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  }
}

applyMigration();
