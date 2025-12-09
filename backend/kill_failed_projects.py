import logging
from src.infrastructure.repository.clip_repo import ClipRepository

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def kill_failed_projects():
    repo = ClipRepository()
    
    # List of IDs provided by the user
    failed_ids = [
        "26260681", "26260679", "26251971", "26251966", "26251965", 
        "26251964", "26251963", "26251960", "26251941"
    ]
    
    print(f"Attempting to delete {len(failed_ids)} failed projects...")
    
    count = 0
    for project_id in failed_ids:
        try:
            repo.delete_project(project_id)
            print(f"Deleted project {project_id}")
            count += 1
        except Exception as e:
            print(f"Error deleting project {project_id}: {e}")
            
    print(f"Finished. Deleted {count} projects.")

if __name__ == "__main__":
    kill_failed_projects()
