import asyncio
import logging
import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

from src.infrastructure.apis.composio import ComposioExecutorService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    entity_id = "default"
    executor = ComposioExecutorService(entity_id=entity_id)
    
    print(f"Checking ALL actions for entity: {entity_id}")
    
    try:
        # Get all connected accounts/apps for this entity
        # Note: Composio SDK might not have a direct "list connected apps" for entity easily exposed 
        # in the way we use it, but we can try to list actions for the known apps again 
        # AND try to list all actions if possible (though get_actions usually requires app_name).
        
        # Let's try to list actions for a broader set of potential app names
        potential_apps = ["YOUTUBE", "YOUTUBE_DATA_API", "FACEBOOK", "FACEBOOK_PAGE", "INSTAGRAM", "INSTAGRAM_BUSINESS"]
        
        for app in potential_apps:
            print(f"\n--- Checking App: {app} ---")
            try:
                actions = await executor.get_actions_for_app(app)
                if not actions:
                    print(f"  No actions found for {app}")
                    continue
                    
                action_names = [a.name for a in actions]
                print(f"  Found {len(action_names)} actions:")
                for name in sorted(action_names):
                    print(f"    - {name}")
            except Exception as e:
                print(f"  Error checking {app}: {e}")

    except Exception as e:
        print(f"General error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
