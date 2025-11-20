"""
Migration script to create wprm_content_status table
Tracks content generation and posting status for WPRM recipes
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


def create_wprm_content_status_table():
    """Create wprm_content_status table"""
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS wprm_content_status (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        recipe_id BIGINT NOT NULL UNIQUE,
        
        -- Content generation status
        status ENUM('not_generated', 'generated', 'posted', 'declined', 'failed') 
            DEFAULT 'not_generated' NOT NULL,
        
        -- Generation tracking
        content_generated BOOLEAN DEFAULT FALSE NOT NULL,
        generation_date DATETIME NULL,
        generated_content TEXT NULL,
        
        -- Posting tracking
        posted BOOLEAN DEFAULT FALSE NOT NULL,
        post_date DATETIME NULL,
        platforms_posted VARCHAR(500) NULL,
        
        -- Metadata
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        
        -- Error tracking
        last_error TEXT NULL,
        retry_count BIGINT DEFAULT 0 NOT NULL,
        
        -- Notes
        notes TEXT NULL,
        
        INDEX idx_recipe_id (recipe_id),
        INDEX idx_status (status),
        INDEX idx_content_generated (content_generated),
        INDEX idx_posted (posted)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        with engine.connect() as connection:
            logger.info("Creating wprm_content_status table...")
            
            # Create table
            connection.execute(text(create_table_sql))
            connection.commit()
            
            logger.info("✅ Table created successfully!")
            
            # Check if table exists
            result = connection.execute(text("""
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'wprm_content_status'
            """))
            
            count = result.fetchone()[0]
            
            if count > 0:
                logger.info("✅ Table 'wprm_content_status' exists and is ready to use")
                
                # Get row count
                row_count_result = connection.execute(text("SELECT COUNT(*) FROM wprm_content_status"))
                row_count = row_count_result.fetchone()[0]
                logger.info(f"   Current rows: {row_count}")
            else:
                logger.error("❌ Table creation failed")
                
    except Exception as e:
        logger.error(f"❌ Error creating table: {e}")
        raise


def populate_initial_data():
    """Populate table with initial data for all WPRM recipes"""
    
    populate_sql = """
    INSERT INTO wprm_content_status (recipe_id, status, content_generated, posted)
    SELECT 
        ID as recipe_id,
        'not_generated' as status,
        FALSE as content_generated,
        FALSE as posted
    FROM wp_tori_posts
    WHERE post_type = 'wprm_recipe' 
    AND post_status = 'publish'
    AND ID NOT IN (SELECT recipe_id FROM wprm_content_status)
    """
    
    try:
        with engine.connect() as connection:
            logger.info("\nPopulating initial data for WPRM recipes...")
            
            result = connection.execute(text(populate_sql))
            connection.commit()
            
            rows_inserted = result.rowcount
            logger.info(f"✅ Inserted {rows_inserted} recipe records")
            
            # Get total count
            total_result = connection.execute(text("SELECT COUNT(*) FROM wprm_content_status"))
            total = total_result.fetchone()[0]
            logger.info(f"   Total recipes tracked: {total}")
            
    except Exception as e:
        logger.error(f"❌ Error populating data: {e}")
        raise


def show_status_summary():
    """Show summary of content status"""
    
    summary_sql = """
    SELECT 
        status,
        COUNT(*) as count
    FROM wprm_content_status
    GROUP BY status
    ORDER BY count DESC
    """
    
    try:
        with engine.connect() as connection:
            logger.info("\n" + "="*60)
            logger.info("CONTENT STATUS SUMMARY")
            logger.info("="*60)
            
            result = connection.execute(text(summary_sql))
            
            for row in result:
                logger.info(f"  {row[0]}: {row[1]} recipes")
            
            logger.info("="*60)
            
    except Exception as e:
        logger.error(f"❌ Error getting summary: {e}")


if __name__ == "__main__":
    logger.info("Starting WPRM Content Status table migration...")
    logger.info("="*60)
    
    # Step 1: Create table
    create_wprm_content_status_table()
    
    # Step 2: Populate initial data
    populate_initial_data()
    
    # Step 3: Show summary
    show_status_summary()
    
    logger.info("\n✅ Migration completed successfully!")
    logger.info("\nNext steps:")
    logger.info("  1. Use /api/content/wprm-recipes-status to check status")
    logger.info("  2. Generate content for recipes with status='not_generated'")
    logger.info("  3. Post content for recipes with status='generated'")
