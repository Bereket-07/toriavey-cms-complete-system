import os
from dotenv import load_dotenv, find_dotenv

# Find and load .env
env_file = find_dotenv()
print(f"Loading .env from: {env_file if env_file else 'NOT FOUND'}")
load_dotenv(env_file)

# Check if credentials are loaded
credentials = {
    "TWITTER_API_KEY": os.getenv("TWITTER_API_KEY"),
    "TWITTER_API_SECRET": os.getenv("TWITTER_API_SECRET"),
    "TWITTER_ACCESS_TOKEN": os.getenv("TWITTER_ACCESS_TOKEN"),
    "TWITTER_ACCESS_TOKEN_SECRET": os.getenv("TWITTER_ACCESS_TOKEN_SECRET"),
}

print("\nCredentials loaded:")
for key, value in credentials.items():
    if value:
        print(f"✅ {key}: {value[:15]}... (length: {len(value)})")
    else:
        print(f"❌ {key}: NOT FOUND")

# Check for common issues
print("\n--- Checking for issues ---")
for key, value in credentials.items():
    if value:
        if value.startswith(" ") or value.endswith(" "):
            print(f"⚠️  {key} has leading/trailing spaces!")
        if '"' in value or "'" in value:
            print(f"⚠️  {key} has quotes in it!")
