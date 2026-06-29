import asyncio
import logging
import pytest
from src.use_cases.auto_generate_clips import AutoGenerateClipsUseCase

# Configure logging
logging.basicConfig(level=logging.INFO)

@pytest.mark.live
async def test_scheduler_logic():
    print("Testing AutoGenerateClipsUseCase...")
    
    use_case = AutoGenerateClipsUseCase()
    
    # Test with a specific handle and limit
    # We use a small limit to avoid spamming
    result = await use_case.execute(
        channel_handle="@ToriAvey",
        platforms=["tiktok"], # Test with one platform first
        max_videos_to_process=1
    )
    
    print("\nResult:")
    print(result)
    
    if result.get("processed", 0) > 0:
        print("SUCCESS: Processed videos.")
    else:
        print("WARNING: No videos processed (maybe no new videos or channel not found).")

if __name__ == "__main__":
    asyncio.run(test_scheduler_logic())
