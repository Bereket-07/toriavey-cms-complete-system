from src.infrastructure.repository.clip_repo import ClipRepository
import time

def verify_persistence():
    repo = ClipRepository()
    project_id = f"verify_proj_{int(time.time())}"
    print(f"1. Creating project: {project_id}")
    
    try:
        # 1. Create
        repo.create_project({
            "project_id": project_id,
            "project_name": "Verification Project",
            "source_video_url": "http://example.com/verify.mp4",
            "source_platform": "youtube",
            "target_platform": "tiktok",
            "language": "en",
            "max_clips": 3
        })
        print("   -> Create successful")
        
        # 2. List
        print("2. Listing projects...")
        projects = repo.get_all_projects()
        found = False
        for p in projects:
            if p['projectId'] == project_id:
                print(f"   -> Found project: {p['projectId']} ({p['platform']})")
                found = True
                break
        
        if not found:
            print("   -> FAILED: Project not found in list!")
            return

        # 3. Get Details
        print(f"3. Getting details for {project_id}...")
        details = repo.get_project_details(project_id)
        if details and details['projectId'] == project_id:
             print(f"   -> Details retrieved successfully: status={details['status']}")
        else:
             print("   -> FAILED: Could not retrieve details")

        # 4. Cleanup (Optional, but good for keeping DB clean)
        # We don't have a delete method exposed yet, so we'll skip or add one if needed.
        # For now, we leave it as 'test data' or manually clean up.
        
        print("Verification PASSED!")

    except Exception as e:
        print(f"Verification FAILED with error: {e}")

if __name__ == "__main__":
    verify_persistence()
