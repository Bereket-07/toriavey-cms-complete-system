from sqlalchemy import TIMESTAMP, BigInteger, Column, DateTime, Integer, String, Text, func
from src.infrastructure.repository.db_config import Base
from src.utils.config import settings

class Recipe(Base):
    __tablename__ = "wp_tori_rp_recipes"  # change this

    id = Column(BigInteger, primary_key=True, autoincrement=True, nullable=False)
    user_id = Column(BigInteger, nullable=False)
    media_id = Column(BigInteger, nullable=False, default=0)
    category = Column(BigInteger, nullable=False, default=1)
    template = Column(String(64), nullable=False, default="standard")
    title = Column(Text, nullable=False)
    slug = Column(Text, nullable=False)
    prep_time = Column(BigInteger, nullable=False)
    cook_time = Column(BigInteger, nullable=False)
    ready_time = Column(Text, nullable=False)
    notes = Column(Text, nullable=False)
    hide_ingredients_header = Column(Integer, nullable=False, default=1)
    ingredients = Column(Text, nullable=False)  # PHP serialized column
    instructions = Column(Text, nullable=False)
    servings = Column(BigInteger, nullable=False)
    servings_size = Column(Text, nullable=False)
    views_total = Column(BigInteger, nullable=False)
    comment_total = Column(BigInteger, nullable=False)
    status = Column(Text, nullable=False)
    featured = Column(Integer, nullable=False, default=0)
    comments_open = Column(Integer, nullable=False, default=1)
    submitter = Column(Text, nullable=False)
    submitter_email = Column(Text, nullable=False)
    added = Column(DateTime, nullable=False)
    published = Column(DateTime, nullable=False)
    updated = Column(DateTime, nullable=False)
    modified = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    def __repr__(self):
        return f"<Recipe id={self.id} title='{self.title[:30]}...'>"

