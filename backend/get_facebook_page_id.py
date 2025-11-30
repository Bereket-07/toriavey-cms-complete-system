# Script to get Facebook Page ID using Composio
import asyncio
from src.infrastructure.apis.facebook_api import FacebookAPI

async def get_page_id():
    entity_id = "default_user"
    facebook_api = FacebookAPI(entity_id=entity_id)
    
    print("=" * 60)
    print("FETCHING FACEBOOK PAGE ID")
    print("=" * 60)
    
    try:
        # Get available actions
        result = await facebook_api.get_available_actions()
        
        if result.get('successful'):
            actions = result.get('actions', [])
            print(f"\n✅ Found {len(actions)} Facebook actions:")
            for i, action in enumerate(actions, 1):
                print(f"{i}. {action}")
        
        print("\n" + "=" * 60)
        print("To get your Page ID:")
        print("1. Go to your Facebook Page")
        print("2. Click 'About' in the left sidebar")
        print("3. Scroll down to 'Page transparency'")
        print("4. Click 'See all' → You'll see Page ID there")
        print("\nOR:")
        print("1. Go to facebook.com/your-page-name")
        print("2. Right-click → View Page Source")
        print("3. Search for 'page_id' or 'pageID'")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(get_page_id())
