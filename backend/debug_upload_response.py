import os
import requests
import json
import hashlib
from dotenv import load_dotenv

load_dotenv()

def main():
    api_key = os.environ.get("COMPOSIO_API_KEY")
    if not api_key:
        print("COMPOSIO_API_KEY not found")
        return

    # Create a dummy video file (or use a text file for structure check, but better to use binary)
    # We'll just create a small text file, the upload structure shouldn't change based on content type
    filename = "test_upload.txt"
    content = b"Hello Composio"
    with open(filename, "wb") as f:
        f.write(content)

    md5_hash = hashlib.md5(content).hexdigest()
    
    upload_request_data = {
        "toolkit_slug": "YOUTUBE",
        "tool_slug": "YOUTUBE_UPLOAD_VIDEO",
        "filename": filename,
        "mimetype": "text/plain",
        "md5": md5_hash
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }
    
    print("Requesting upload URL...")
    response = requests.post(
        "https://backend.composio.dev/api/v3/files/upload/request",
        json=upload_request_data,
        headers=headers
    )
    
    if not response.ok:
        print(f"Error: {response.text}")
        return

    data = response.json()
    print("Keys:", list(data.keys()))
    print("id:", data.get("id"))
    print("key:", data.get("key"))
    print("fileKey:", data.get("fileKey"))
    print("s3key:", data.get("s3key"))
    print("metadata:", data.get("metadata"))

    # Clean up
    if os.path.exists(filename):
        os.remove(filename)

if __name__ == "__main__":
    main()
