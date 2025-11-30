"""
Add per-platform posting status columns to wprm_generated_content table

This migration adds columns to track posting status for each platform individually:
- posted_platforms: JSON array of platforms where content has been posted
- platform_post_data: JSON object with post IDs, URLs, and timestamps per platform
"""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, text
from src.infrastructure.repository.db_config import DATABASE_URL
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


MIGRATION_SQL = """
-- Add new columns for per-platform posting status
ALTER TABLE wprm_generated_content
ADD COLUMN IF NOT EXISTS posted_platforms JSON NULL COMMENT 'Array of platforms where content has been posted',
ADD COLUMN IF NOT EXISTS platform_post_data JSON NULL COMMENT 'Object with post IDs, URLs, and timestamps per platform';
"""

ROLLBACK_SQL = """
-- Remove the added columns
ALTER TABLE wprm_generated_content
DROP COLUMN IF EXISTS posted_platforms,
DROP COLUMN IF EXISTS platform_post_data;
"""


def migrate():
    """Run the migration"""
    try:
        logger.info("Connecting to database...")
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            logger.info("Adding per-platform status columns...")
            
            # Execute migration
            for statement in MIGRATION_SQL.strip().split(';'):
                if statement.strip():
                    conn.execute(text(statement))
            
            conn.commit()
            logger.info("✅ Migration completed successfully!")
            
            # Verify columns exist
            result = conn.execute(text("DESCRIBE wprm_generated_content"))
            logger.info("\n📊 Updated Table Structure:")
            for row in result:
                logger.info(f"  {row[0]}: {row[1]}")
                
    except Exception as e:
        logger.error(f"❌ Error running migration: {e}")
        raise


def rollback():
    """Rollback the migration"""
    try:
        logger.info("Connecting to database...")
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            logger.info("Rolling back per-platform status columns...")
            
            # Execute rollback
            for statement in ROLLBACK_SQL.strip().split(';'):
                if statement.strip():
                    conn.execute(text(statement))
            
            conn.commit()
            logger.info("✅ Rollback completed successfully!")
                
    except Exception as e:
        logger.error(f"❌ Error rolling back migration: {e}")
        raise


if __name__ == "__main__":
    print("="*60)
    print("🗄️  PER-PLATFORM POSTING STATUS MIGRATION")
    print("="*60)
    
    print("\nThis migration will add:")
    print("  - posted_platforms: JSON array of platforms")
    print("  - platform_post_data: JSON object with post details")
    print("\n" + "="*60)
    
    response = input("Run migration? (yes/no/rollback): ").strip().lower()
    
    if response in ['yes', 'y']:
        migrate()
    elif response == 'rollback':
        rollback()
    else:
        logger.info("Migration cancelled")
    
    print("\n" + "="*60)
    print("✅ Done!")
    print("="*60)
