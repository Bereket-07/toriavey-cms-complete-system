"""
Script to check all tables in the database and find the correct recipes table
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from src.infrastructure.repository.db_config import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_database_tables():
    """Check all tables in the database"""
    
    try:
        with engine.connect() as connection:
            # Get all tables
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            logger.info(f"\n{'='*60}")
            logger.info(f"TOTAL TABLES IN DATABASE: {len(tables)}")
            logger.info(f"{'='*60}\n")
            
            # Look for recipe-related tables
            recipe_tables = [t for t in tables if 'recipe' in t.lower()]
            
            if recipe_tables:
                logger.info(f"📋 RECIPE-RELATED TABLES FOUND:")
                for table in recipe_tables:
                    logger.info(f"  - {table}")
                logger.info("")
            
            # Check wp_tori_rp_recipes specifically
            if 'wp_tori_rp_recipes' in tables:
                logger.info(f"✅ Table 'wp_tori_rp_recipes' EXISTS")
                
                # Get row count
                count_result = connection.execute(
                    text("SELECT COUNT(*) as count FROM wp_tori_rp_recipes")
                )
                count = count_result.fetchone()[0]
                logger.info(f"   Total rows: {count}")
                
                # Check if content_generated column exists
                columns = inspector.get_columns('wp_tori_rp_recipes')
                column_names = [col['name'] for col in columns]
                
                if 'content_generated' in column_names:
                    logger.info(f"   ✅ Column 'content_generated' EXISTS")
                    
                    # Check content_generated stats
                    stats_result = connection.execute(
                        text("""
                            SELECT 
                                COUNT(*) as total,
                                SUM(CASE WHEN content_generated = 1 THEN 1 ELSE 0 END) as generated,
                                SUM(CASE WHEN content_generated = 0 THEN 1 ELSE 0 END) as pending
                            FROM wp_tori_rp_recipes
                        """)
                    )
                    stats = stats_result.fetchone()
                    logger.info(f"   Total recipes: {stats[0]}")
                    logger.info(f"   Content generated: {stats[1]}")
                    logger.info(f"   Pending generation: {stats[2]}")
                else:
                    logger.warning(f"   ❌ Column 'content_generated' DOES NOT EXIST")
                
                logger.info("")
            else:
                logger.warning(f"❌ Table 'wp_tori_rp_recipes' NOT FOUND")
                logger.info("")
            
            # Check for other potential recipe tables
            logger.info(f"🔍 ALL TABLES IN DATABASE:")
            for i, table in enumerate(sorted(tables), 1):
                # Get row count for each table
                try:
                    count_result = connection.execute(
                        text(f"SELECT COUNT(*) as count FROM {table}")
                    )
                    count = count_result.fetchone()[0]
                    logger.info(f"  {i}. {table} ({count} rows)")
                except Exception as e:
                    logger.info(f"  {i}. {table} (error getting count)")
            
            logger.info(f"\n{'='*60}")
            
    except Exception as e:
        logger.error(f"❌ Error checking database: {e}")
        raise


if __name__ == "__main__":
    logger.info("Checking database tables...")
    check_database_tables()
    logger.info("Check completed!")
