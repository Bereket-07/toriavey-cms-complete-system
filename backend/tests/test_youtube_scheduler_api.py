import httpx
import time

BASE_URL = "http://localhost:7001/api/youtube-scheduler"

def test_api():
    print("Testing YouTube Scheduler API...")
    
    # 1. Get Status
    try:
        resp = httpx.get(f"{BASE_URL}/status")
        print(f"GET /status: {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"Failed to connect: {e}")
        return

    # 2. Update Config
    config_payload = {
        "interval_minutes": 120,
        "platforms": ["tiktok", "instagram_reels"],
        "max_videos": 1
    }
    resp = httpx.put(f"{BASE_URL}/config", json=config_payload)
    print(f"PUT /config: {resp.status_code} - {resp.json()}")

    # 3. Start Scheduler (Interval)
    resp = httpx.post(f"{BASE_URL}/start", json={"interval_minutes": 60})
    print(f"POST /start: {resp.status_code} - {resp.json()}")
    
    # 4. Stop Scheduler
    resp = httpx.post(f"{BASE_URL}/stop")
    print(f"POST /stop: {resp.status_code} - {resp.json()}")

    # 5. Start Scheduler (Cron)
    # Run every minute for testing
    resp = httpx.post(f"{BASE_URL}/start-cron", json={"cron_expression": "* * * * *"})
    print(f"POST /start-cron: {resp.status_code} - {resp.json()}")
    
    # 6. Stop again
    resp = httpx.post(f"{BASE_URL}/stop")
    print(f"POST /stop: {resp.status_code} - {resp.json()}")

if __name__ == "__main__":
    test_api()
