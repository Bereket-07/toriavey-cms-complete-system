from src.infrastructure.repository.db_config import SessionLocal
from src.domain.models.clip_model import VizardProject, VideoClip

def clear_test_data():
    db = SessionLocal()
    try:
        print("Clearing test projects...")
        projects = db.query(VizardProject).filter(VizardProject.project_id.like("test_proj_%")).all()
        for p in projects:
            print(f"Deleting project: {p.project_id}")
            # Delete associated clips first
            db.query(VideoClip).filter(VideoClip.vizard_project_id == p.project_id).delete()
            db.delete(p)
        
        db.commit()
        print("Test data cleared successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_test_data()
