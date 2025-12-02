from src.infrastructure.repository.clip_repo import ClipRepository
import json

def check_details():
    repo = ClipRepository()
    # Use one of the IDs from the user's error log
    project_id = "test_proj_1764617306" 
    print(f"Checking details for: {project_id}")
    
    try:
        details = repo.get_project_details(project_id)
        print(json.dumps(details, indent=2, default=str))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_details()
