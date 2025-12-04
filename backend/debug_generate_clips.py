import requests
import json

def debug_generate():
    url = "http://127.0.0.1:8000/api/clips/generate"
    
    # Payload matching the corrected frontend structure AND backend schema
    payload = {
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "source_type": "youtube",
        "target_platforms": ["facebook"],
        "language": "en"
    }
    
    print(f"Sending POST request to {url} with payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(url, json=payload)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code in [200, 202]:
            print("\nSUCCESS: Backend accepted the payload.")
        else:
            print("\nFAILURE: Backend rejected the payload.")
            
    except Exception as e:
        print(f"\nError: {e}")

if __name__ == "__main__":
    debug_generate()
