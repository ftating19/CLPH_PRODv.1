# Database Migrations

This folder contains SQL migration scripts for the database schema updates.

## How to Apply Migrations

### Using MySQL Command Line:

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Run the migration script
source /path/to/add_updated_at_to_forums.sql
```

### Using MySQL Workbench:

1. Open MySQL Workbench
2. Connect to your database
3. Open the SQL file: `File > Open SQL Script`
4. Select `add_updated_at_to_forums.sql`
5. Click the lightning bolt icon to execute

### Using phpMyAdmin:

1. Login to phpMyAdmin
2. Select your database
3. Click on the "SQL" tab
4. Copy and paste the contents of `add_updated_at_to_forums.sql`
5. Click "Go"

## Migration: add_updated_at_to_forums.sql

This migration adds an `updated_at` column to the `forums` table to track when posts are edited.

**Changes:**
- Adds `updated_at` DATETIME column (nullable)
- Adds an index on `updated_at` for better query performance
- Maintains the original `created_at` timestamp

**What it does:**
- Allows the system to track when a forum post was last edited
- The frontend will display an "Edited" badge if `updated_at` is different from `created_at`
- Shows both the original creation time and the last edit time

## Verifying the Migration

After applying the migration, verify it was successful:

```sql
-- Check if the column was added
DESCRIBE forums;

-- Check the indexes
SHOW INDEX FROM forums;
```

You should see the `updated_at` column in the forums table structure.
