from src.infrastructure.repository.clip_repo import ClipRepository
import time

def test_insert():
    repo = ClipRepository()
    project_id = f"test_proj_{int(time.time())}"
    print(f"Attempting to create project: {project_id}")
    
    try:
        project = repo.create_project({
            "project_id": project_id,
            "project_name": "Test Project",
            "source_video_url": "http://example.com/video.mp4",
            "source_platform": "youtube",
            "target_platform": "youtube_shorts",
            "language": "en",
            "max_clips": 5
        })
        print(f"Project created: {project.id}")
        
        # Verify
        p = repo.get_project_by_vizard_id(project_id)
        if p:
            print(f"Verification successful: Found project {p.project_id}")
        else:
            print("Verification failed: Project not found in DB")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_insert()
