import asyncio
from sqlalchemy import create_engine, text
from src.infrastructure.repository.db_config import DATABASE_URL

def check_clips_content():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        # Get recent projects
        projects_result = conn.execute(text("SELECT project_id, project_name FROM vizard_projects ORDER BY created_at DESC LIMIT 3"))
        projects = projects_result.fetchall()
        
        print(f"Checking clips for {len(projects)} recent projects:")
        for p in projects:
            print(f"Project: {p.project_name} (ID: {p.project_id})")
            # Check clips for this project
            # Note: Parameter biding is safer but for this quick script f-string is okay if IDs are safe strings
            clips_result = conn.execute(text(f"SELECT id, title, clip_url FROM video_clips WHERE vizard_project_id = '{p.project_id}'"))
            clips = clips_result.fetchall()
            print(f"  Found {len(clips)} clips:")
            for c in clips:
                print(f"    - Clip {c.id}: {c.title}")

if __name__ == "__main__":
    check_clips_content()
