-- Simple fix for status column
-- Run this in your MySQL client or phpMyAdmin

USE tori_cms;  -- Replace with your actual database name

-- Fix the status column
ALTER TABLE wprm_content_status 
MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'not_generated';

-- Verify the fix
SHOW COLUMNS FROM wprm_content_status WHERE Field = 'status';
