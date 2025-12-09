import asyncio
import pytest
from src.infrastructure.repository.clip_repo import ClipRepository
from src.infrastructure.repository.db_config import SessionLocal
from src.domain.models.clip_model import VizardProject
from src.controllers.clip_controller import list_projects

# Mocking the database session for safety, but here we might want to use the real one 
# if we are running against a dev DB. 
# Since I can't easily mock everything in this environment without a full pytest setup,
# I will write a script that can be run directly.

async def test_async_cleanup():
    print("Setting up test data...")
    repo = ClipRepository()
    db = SessionLocal()
    
    # Create a dummy failed project
    failed_project_id = "test_failed_project_123"
    try:
        # Clean up if exists
        existing = db.query(VizardProject).filter(VizardProject.project_id == failed_project_id).first()
        if existing:
            db.delete(existing)
            db.commit()
            
        project = VizardProject(
            project_id=failed_project_id,
            project_name="Test Failed Project",
            source_video_url="http://example.com/video.mp4",
            source_platform="youtube",
            target_platform="tiktok",
            error_message="This is a test failure"
        )
        db.add(project)
        db.commit()
        print(f"Created failed project: {failed_project_id}")
        
        # Verify it exists
        p = db.query(VizardProject).filter(VizardProject.project_id == failed_project_id).first()
        assert p is not None
        assert p.error_message is not None
        
        print("Calling list_projects (which should trigger cleanup)...")
        # Call the controller function directly (it's async)
        projects = await list_projects()
        
        print(f"Got {len(projects)} projects")
        
        # Verify failed project is gone - use fresh session
        db.close()
        db = SessionLocal()
        p_after = db.query(VizardProject).filter(VizardProject.project_id == failed_project_id).first()
        if p_after is None:
            print("SUCCESS: Failed project was deleted.")
            with open("test_result.txt", "w") as f:
                f.write("SUCCESS")
        else:
            print("FAILURE: Failed project still exists.")
            with open("test_result.txt", "w") as f:
                f.write("FAILURE")
            
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        # Cleanup
        p = db.query(VizardProject).filter(VizardProject.project_id == failed_project_id).first()
        if p:
            db.delete(p)
            db.commit()
        db.close()

if __name__ == "__main__":
    asyncio.run(test_async_cleanup())
