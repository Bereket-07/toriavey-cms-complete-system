from src.infrastructure.repository.clip_repo import ClipRepository

def check_db():
    repo = ClipRepository()
    projects = repo.get_all_projects()
    print(f"Found {len(projects)} projects in DB:")
    for p in projects:
        print(f"- {p['projectId']} ({p['platform']}): {p['status']}")

if __name__ == "__main__":
    check_db()
