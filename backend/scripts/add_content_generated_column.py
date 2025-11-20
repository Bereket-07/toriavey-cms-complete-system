"""
Migration script to add content_generated column to wp_tori_rp_recipes table.

This script adds a boolean column to track whether content has been generated for each recipe.
Run this once to update your existing database.

Usage:
    python -m scripts.add_content_generated_column
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from src.infrastructure.repository.db_config import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def add_content_generated_column():
    """Add content_generated column to recipes table"""
    
    # SQL to add the column
    add_column_sql = """
    ALTER TABLE wp_tori_rp_recipes 
    ADD COLUMN content_generated BOOLEAN NOT NULL DEFAULT FALSE
    """
    
    # SQL to check if column already exists
    check_column_sql = """
    SELECT COUNT(*) as count
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wp_tori_rp_recipes' 
    AND COLUMN_NAME = 'content_generated'
    """
    
    try:
        with engine.connect() as connection:
            # Check if column already exists
            result = connection.execute(text(check_column_sql))
            row = result.fetchone()
            
            if row[0] > 0:
                logger.info("✅ Column 'content_generated' already exists. Skipping migration.")
                return
            
            # Add the column
            logger.info("Adding 'content_generated' column to wp_tori_rp_recipes table...")
            connection.execute(text(add_column_sql))
            connection.commit()
            
            logger.info("✅ Successfully added 'content_generated' column!")
            logger.info("All existing recipes are marked as content_generated=FALSE by default.")
            
    except Exception as e:
        logger.error(f"❌ Failed to add column: {e}")
        raise


if __name__ == "__main__":
    logger.info("Starting database migration...")
    add_content_generated_column()
    logger.info("Migration completed!")
