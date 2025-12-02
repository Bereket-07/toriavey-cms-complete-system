from sqlmodel import SQLModel
from src.infrastructure.repository.db_config import engine
from src.domain.models.clip_model import VideoClip, VizardProject, SocialPost

def create_tables():
    print("Creating tables...")
    SQLModel.metadata.create_all(engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    create_tables()
