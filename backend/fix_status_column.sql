-- Fix status column size in wprm_content_status table
-- This fixes the error: "Data truncated for column 'status' at row 1"

-- Check current column definition
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wprm_content_status'
    AND COLUMN_NAME = 'status';

-- Modify the status column to be VARCHAR(50) to accommodate all status values
ALTER TABLE wprm_content_status 
MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'not_generated';

-- Verify the change
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wprm_content_status'
    AND COLUMN_NAME = 'status';

-- Show all possible status values that need to fit:
-- 'not_generated' (13 chars)
-- 'generated' (9 chars)
-- 'pending' (7 chars)
-- 'posted' (6 chars)
-- 'declined' (8 chars)
-- 'failed' (6 chars)
