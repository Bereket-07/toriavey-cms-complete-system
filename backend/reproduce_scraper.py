import asyncio
from src.infrastructure.scrapers.youtube_scraper import YouTubeScraper

async def test_scraper():
    scraper = YouTubeScraper()
    handle = "@ToriAvey"
    print(f"Fetching channel ID for {handle}...")
    channel_id = await scraper.get_channel_id(handle)
    print(f"Channel ID: {channel_id}")
    
    if channel_id:
        print(f"Fetching latest videos for {channel_id}...")
        videos = await scraper.get_latest_videos(channel_id)
        print(f"Found {len(videos)} videos.")
        for v in videos[:3]:
            print(f"- {v['title']} ({v['url']})")
    else:
        print("Failed to get channel ID.")

if __name__ == "__main__":
    asyncio.run(test_scraper())
