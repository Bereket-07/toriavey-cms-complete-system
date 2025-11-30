# Test script to list all Instagram actions from Composio
import asyncio
from src.infrastructure.apis.instagram_api import InstagramAPI

async def main():
    # Use your entity ID
    entity_id = "default_user"
    
    instagram_api = InstagramAPI(entity_id=entity_id)
    
    print("=" * 60)
    print("FETCHING ALL INSTAGRAM ACTIONS FROM COMPOSIO")
    print("=" * 60)
    
    result = await instagram_api.get_available_actions()
    
    if result.get('successful'):
        actions = result.get('actions', [])
        print(f"\nFound {len(actions)} Instagram actions:\n")
        for i, action in enumerate(actions, 1):
            print(f"{i}. {action}")
    else:
        print(f"\nError: {result.get('error')}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
