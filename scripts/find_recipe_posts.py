"""
Script to find recipes in wp_tori_posts table
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


def find_recipe_posts():
    """Find recipes in wp_tori_posts table"""
    
    try:
        with engine.connect() as connection:
            logger.info(f"\n{'='*60}")
            logger.info(f"SEARCHING FOR RECIPES IN wp_tori_posts")
            logger.info(f"{'='*60}\n")
            
            # Check post types
            post_types_result = connection.execute(
                text("""
                    SELECT post_type, COUNT(*) as count
                    FROM wp_tori_posts
                    GROUP BY post_type
                    ORDER BY count DESC
                """)
            )
            
            logger.info("📊 POST TYPES IN wp_tori_posts:")
            for row in post_types_result:
                logger.info(f"  - {row[0]}: {row[1]} posts")
            logger.info("")
            
            # Look for recipe post type
            recipe_count_result = connection.execute(
                text("""
                    SELECT COUNT(*) as count
                    FROM wp_tori_posts
                    WHERE post_type LIKE '%recipe%'
                """)
            )
            recipe_count = recipe_count_result.fetchone()[0]
            
            if recipe_count > 0:
                logger.info(f"✅ FOUND {recipe_count} RECIPE POSTS!")
                
                # Get sample recipes
                sample_recipes = connection.execute(
                    text("""
                        SELECT ID, post_title, post_type, post_status, post_date
                        FROM wp_tori_posts
                        WHERE post_type LIKE '%recipe%'
                        AND post_status = 'publish'
                        LIMIT 5
                    """)
                )
                
                logger.info(f"\n📋 SAMPLE RECIPES:")
                for recipe in sample_recipes:
                    logger.info(f"  ID: {recipe[0]}")
                    logger.info(f"  Title: {recipe[1]}")
                    logger.info(f"  Type: {recipe[2]}")
                    logger.info(f"  Status: {recipe[3]}")
                    logger.info(f"  Date: {recipe[4]}")
                    logger.info("")
            else:
                logger.warning(f"❌ No posts with 'recipe' in post_type found")
            
            # Check wp_tori_postmeta for recipe metadata
            logger.info(f"\n{'='*60}")
            logger.info(f"CHECKING wp_tori_postmeta FOR RECIPE DATA")
            logger.info(f"{'='*60}\n")
            
            recipe_meta_result = connection.execute(
                text("""
                    SELECT meta_key, COUNT(*) as count
                    FROM wp_tori_postmeta
                    WHERE meta_key LIKE '%recipe%'
                    GROUP BY meta_key
                    ORDER BY count DESC
                    LIMIT 20
                """)
            )
            
            logger.info("📊 RECIPE-RELATED META KEYS:")
            for row in recipe_meta_result:
                logger.info(f"  - {row[0]}: {row[1]} entries")
            logger.info("")
            
            # Check wp_tori_postmeta_b_recipe_imgs
            logger.info(f"\n{'='*60}")
            logger.info(f"CHECKING wp_tori_postmeta_b_recipe_imgs")
            logger.info(f"{'='*60}\n")
            
            recipe_imgs_count = connection.execute(
                text("SELECT COUNT(*) FROM wp_tori_postmeta_b_recipe_imgs")
            )
            img_count = recipe_imgs_count.fetchone()[0]
            logger.info(f"Total recipe image entries: {img_count}")
            
            # Get sample
            sample_imgs = connection.execute(
                text("""
                    SELECT meta_id, post_id, meta_key
                    FROM wp_tori_postmeta_b_recipe_imgs
                    LIMIT 5
                """)
            )
            
            logger.info(f"\nSample entries:")
            for img in sample_imgs:
                logger.info(f"  Post ID: {img[1]}, Meta Key: {img[2]}")
            
            logger.info(f"\n{'='*60}")
            logger.info(f"RECOMMENDATION")
            logger.info(f"{'='*60}\n")
            
            if recipe_count > 0:
                logger.info(f"✅ Use wp_tori_posts with post_type LIKE '%recipe%'")
                logger.info(f"✅ Join with wp_tori_postmeta for recipe details")
                logger.info(f"✅ Join with wp_tori_postmeta_b_recipe_imgs for images")
            else:
                logger.info(f"⚠️  Need to identify correct post_type for recipes")
                logger.info(f"   Check the post types listed above")
            
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    logger.info("Finding recipe posts...")
    find_recipe_posts()
    logger.info("Search completed!")
