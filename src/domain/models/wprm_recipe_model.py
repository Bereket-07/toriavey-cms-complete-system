"""
WordPress Recipe Maker (WPRM) Recipe Model
Accesses recipes from wp_tori_posts with post_type='wprm_recipe'
"""

from sqlalchemy import Column, BigInteger, String, Text, DateTime, Boolean
from src.infrastructure.repository.db_config import Base


class WPRMRecipe(Base):
    """WordPress Recipe Maker Recipe from wp_tori_posts"""
    __tablename__ = "wp_tori_posts"
    
    ID = Column(BigInteger, primary_key=True, name="ID")
    post_author = Column(BigInteger)
    post_date = Column(DateTime)
    post_date_gmt = Column(DateTime)
    post_content = Column(Text)
    post_title = Column(Text)
    post_excerpt = Column(Text)
    post_status = Column(String(20))
    comment_status = Column(String(20))
    ping_status = Column(String(20))
    post_password = Column(String(255))
    post_name = Column(String(200))
    to_ping = Column(Text)
    pinged = Column(Text)
    post_modified = Column(DateTime)
    post_modified_gmt = Column(DateTime)
    post_content_filtered = Column(Text)
    post_parent = Column(BigInteger)
    guid = Column(String(255))
    menu_order = Column(BigInteger)
    post_type = Column(String(20))
    post_mime_type = Column(String(100))
    comment_count = Column(BigInteger)
    
    def __repr__(self):
        return f"<WPRMRecipe ID={self.ID} title='{self.post_title[:30]}...'>"


class WPRMPostMeta(Base):
    """WordPress Post Metadata for recipes"""
    __tablename__ = "wp_tori_postmeta"
    
    meta_id = Column(BigInteger, primary_key=True)
    post_id = Column(BigInteger)
    meta_key = Column(String(255))
    meta_value = Column(Text)
    
    def __repr__(self):
        return f"<WPRMPostMeta post_id={self.post_id} key='{self.meta_key}'>"


class WPRMRecipeImage(Base):
    """Recipe images from wp_tori_postmeta_b_recipe_imgs"""
    __tablename__ = "wp_tori_postmeta_b_recipe_imgs"
    
    meta_id = Column(BigInteger, primary_key=True)
    post_id = Column(BigInteger)
    meta_key = Column(String(255))
    meta_value = Column(Text)
    
    def __repr__(self):
        return f"<WPRMRecipeImage post_id={self.post_id}>"
