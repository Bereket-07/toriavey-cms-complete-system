from sqlmodel import SQLModel
from src.infrastructure.repository.db_config import engine
from src.domain.models.clip_model import VideoClip, VizardProject, SocialPost

def recreate_tables():
    print("Dropping tables...")
    SQLModel.metadata.drop_all(engine)
    print("Creating tables...")
    SQLModel.metadata.create_all(engine)
    print("Tables recreated successfully!")

if __name__ == "__main__":
    recreate_tables()
