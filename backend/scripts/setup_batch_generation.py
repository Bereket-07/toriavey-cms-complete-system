"""
Setup script for batch content generation feature.

This script:
1. Checks database connection
2. Adds content_generated column if needed
3. Displays current statistics
4. Provides next steps

Usage:
    python scripts/setup_batch_generation.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from src.infrastructure.repository.db_config import engine
from src.infrastructure.repository.recipe_repo import RecipeRepository
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


def check_database_connection():
    """Check if database connection is working"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.fetchone()
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


def check_column_exists():
    """Check if content_generated column exists"""
    check_column_sql = """
    SELECT COUNT(*) as count
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wp_tori_rp_recipes' 
    AND COLUMN_NAME = 'content_generated'
    """
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text(check_column_sql))
            row = result.fetchone()
            return row[0] > 0
    except Exception as e:
        logger.error(f"❌ Failed to check column: {e}")
        return False


def add_column():
    """Add content_generated column"""
    add_column_sql = """
    ALTER TABLE wp_tori_rp_recipes 
    ADD COLUMN content_generated BOOLEAN NOT NULL DEFAULT FALSE
    """
    
    try:
        with engine.connect() as connection:
            logger.info("Adding 'content_generated' column...")
            connection.execute(text(add_column_sql))
            connection.commit()
        logger.info("✅ Column added successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to add column: {e}")
        return False


def display_stats():
    """Display current statistics"""
    try:
        repo = RecipeRepository()
        stats = repo.get_content_generation_stats()
        
        logger.info("\n" + "="*60)
        logger.info("📊 CONTENT GENERATION STATISTICS")
        logger.info("="*60)
        logger.info(f"Total Recipes: {stats['total_recipes']}")
        logger.info(f"Content Generated: {stats['content_generated']}")
        logger.info(f"Pending Generation: {stats['pending_generation']}")
        logger.info(f"Completion: {stats['completion_percentage']}%")
        logger.info("="*60 + "\n")
        
        return stats
    except Exception as e:
        logger.error(f"❌ Failed to get statistics: {e}")
        return None


def main():
    """Main setup function"""
    logger.info("🚀 Starting Batch Content Generation Setup\n")
    
    # Step 1: Check database connection
    logger.info("Step 1: Checking database connection...")
    if not check_database_connection():
        logger.error("\n❌ Setup failed: Cannot connect to database")
        logger.info("Please check your database configuration in .env file")
        return False
    
    # Step 2: Check/add column
    logger.info("\nStep 2: Checking content_generated column...")
    if check_column_exists():
        logger.info("✅ Column 'content_generated' already exists")
    else:
        logger.info("Column doesn't exist. Adding it now...")
        if not add_column():
            logger.error("\n❌ Setup failed: Cannot add column")
            return False
    
    # Step 3: Display statistics
    logger.info("\nStep 3: Fetching statistics...")
    stats = display_stats()
    
    if not stats:
        logger.error("\n❌ Setup failed: Cannot fetch statistics")
        return False
    
    # Step 4: Provide next steps
    logger.info("✅ Setup completed successfully!\n")
    logger.info("="*60)
    logger.info("🎯 NEXT STEPS")
    logger.info("="*60)
    
    if stats['pending_generation'] > 0:
        logger.info(f"\n1. You have {stats['pending_generation']} recipes ready for content generation")
        logger.info("\n2. Start your FastAPI server:")
        logger.info("   python -m uvicorn src.app:app --reload")
        logger.info("\n3. Generate content using the API:")
        logger.info("   POST http://localhost:8000/api/content/generate-from-unprocessed")
        logger.info("\n4. Example request body:")
        logger.info("""   {
     "target_platforms": ["instagram", "twitter", "facebook"],
     "limit": 10,
     "tone": "warm and inviting",
     "include_emojis": true,
     "max_hashtags": 10
   }""")
        logger.info("\n5. Check the API documentation:")
        logger.info("   http://localhost:8000/docs")
        logger.info("\n6. Read the full guide:")
        logger.info("   BATCH_CONTENT_GENERATION_GUIDE.md")
    else:
        logger.info("\n✅ All recipes have content generated!")
        logger.info("\nTo regenerate content for a recipe:")
        logger.info("1. Reset the flag using RecipeRepository.reset_content_generated(recipe_id)")
        logger.info("2. Run the batch generation again")
    
    logger.info("\n" + "="*60 + "\n")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
