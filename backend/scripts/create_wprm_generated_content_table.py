"""
Create wprm_generated_content table for relational content storage

This creates a proper relational structure where:
- Each platform's content is stored separately
- Status is tracked per platform per recipe
- Content can be reused and versioned
- Easy to query by recipe, platform, or status
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


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS wprm_generated_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    content JSON NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'generated',
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    posted_at DATETIME NULL,
    parsed BOOLEAN DEFAULT FALSE,
    fallback_used BOOLEAN DEFAULT FALSE,
    post_id VARCHAR(255) NULL,
    post_url VARCHAR(500) NULL,
    error_message TEXT NULL,
    retry_count INT DEFAULT 0,
    
    INDEX idx_recipe_id (recipe_id),
    INDEX idx_platform (platform),
    INDEX idx_status (status),
    INDEX idx_recipe_platform (recipe_id, platform),
    INDEX idx_recipe_status (recipe_id, status),
    
    UNIQUE KEY unique_recipe_platform (recipe_id, platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""


def create_table():
    """Create the wprm_generated_content table"""
    try:
        logger.info("Connecting to database...")
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            logger.info("Creating wprm_generated_content table...")
            conn.execute(text(CREATE_TABLE_SQL))
            conn.commit()
            logger.info("✅ Table created successfully!")
            
            # Verify table exists
            result = conn.execute(text("""
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'wprm_generated_content'
            """))
            count = result.fetchone()[0]
            
            if count > 0:
                logger.info("✅ Table verified in database")
                
                # Show table structure
                result = conn.execute(text("DESCRIBE wprm_generated_content"))
                logger.info("\n📊 Table Structure:")
                for row in result:
                    logger.info(f"  {row[0]}: {row[1]}")
            else:
                logger.error("❌ Table not found after creation")
                
    except Exception as e:
        logger.error(f"❌ Error creating table: {e}")
        raise


def migrate_existing_data():
    """
    Migrate data from old wprm_content_status.generated_content (JSON)
    to new wprm_generated_content table (relational)
    """
    try:
        logger.info("\n🔄 Migrating existing data...")
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Get all recipes with generated content
            result = conn.execute(text("""
                SELECT recipe_id, generated_content, status, generation_date, post_date
                FROM wprm_content_status
                WHERE generated_content IS NOT NULL
            """))
            
            recipes = result.fetchall()
            logger.info(f"Found {len(recipes)} recipes with generated content")
            
            migrated_count = 0
            for recipe in recipes:
                recipe_id = recipe[0]
                generated_content = recipe[1]
                status = recipe[2]
                generation_date = recipe[3]
                post_date = recipe[4]
                
                if not generated_content:
                    continue
                
                # Parse JSON content
                import json
                try:
                    content_dict = json.loads(generated_content) if isinstance(generated_content, str) else generated_content
                except:
                    logger.warning(f"Could not parse content for recipe {recipe_id}")
                    continue
                
                # Insert each platform's content as separate record
                for platform, platform_content in content_dict.items():
                    if not platform_content:
                        continue
                    
                    # Determine if parsed successfully
                    parsed = platform_content.get('parsed', False)
                    fallback_used = platform_content.get('fallback', False)
                    
                    # Insert into new table
                    conn.execute(text("""
                        INSERT INTO wprm_generated_content 
                        (recipe_id, platform, content, status, generated_at, posted_at, parsed, fallback_used)
                        VALUES (:recipe_id, :platform, :content, :status, :generated_at, :posted_at, :parsed, :fallback_used)
                        ON DUPLICATE KEY UPDATE
                            content = VALUES(content),
                            status = VALUES(status),
                            updated_at = CURRENT_TIMESTAMP
                    """), {
                        'recipe_id': recipe_id,
                        'platform': platform,
                        'content': json.dumps(platform_content),
                        'status': status,
                        'generated_at': generation_date or 'CURRENT_TIMESTAMP',
                        'posted_at': post_date,
                        'parsed': parsed,
                        'fallback_used': fallback_used
                    })
                    migrated_count += 1
            
            conn.commit()
            logger.info(f"✅ Migrated {migrated_count} content records")
            
    except Exception as e:
        logger.error(f"❌ Error migrating data: {e}")
        raise


if __name__ == "__main__":
    print("="*60)
    print("🗄️  WPRM GENERATED CONTENT TABLE SETUP")
    print("="*60)
    
    # Create table
    create_table()
    
    # Ask if user wants to migrate existing data
    print("\n" + "="*60)
    response = input("Do you want to migrate existing data? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        migrate_existing_data()
    else:
        logger.info("Skipping data migration")
    
    print("\n" + "="*60)
    print("✅ Setup complete!")
    print("="*60)
    print("\n📊 New Relational Structure:")
    print("  - wprm_generated_content: Stores content per platform per recipe")
    print("  - wprm_content_status: Tracks overall recipe status")
    print("\n🔗 Benefits:")
    print("  ✅ Each platform's content stored separately")
    print("  ✅ Easy to query by recipe, platform, or status")
    print("  ✅ Content can be reused and versioned")
    print("  ✅ Better performance with proper indexes")
    print("="*60)
