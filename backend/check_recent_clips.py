import asyncio
from sqlalchemy import create_engine, text
from src.infrastructure.repository.db_config import DATABASE_URL

def check_recent_clips():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        # Check for projects created in the last 10 minutes
        result = conn.execute(text("SELECT project_id, project_name, created_at, is_processed, error_message FROM vizard_projects ORDER BY created_at DESC LIMIT 5"))
        rows = result.fetchall()
        
        print(f"Found {len(rows)} recent projects:")
        for row in rows:
            status = "Processed" if row.is_processed else "Processing"
            if row.error_message:
                status = f"Failed: {row.error_message}"
            print(f"- {row.project_name} ({status}) - {row.created_at}")

if __name__ == "__main__":
    check_recent_clips()
