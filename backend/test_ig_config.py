import os
from dotenv import load_dotenv, find_dotenv

# Load .env
env_file = find_dotenv()
print(f"Loading .env from: {env_file}")
load_dotenv(env_file)

# Check Instagram ID
ig_id = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")
print(f"\nINSTAGRAM_BUSINESS_ACCOUNT_ID = '{ig_id}'")
print(f"Length: {len(ig_id)}")
print(f"Is empty: {not bool(ig_id)}")

if ig_id:
    print(f"✅ Instagram ID is loaded correctly!")
else:
    print(f"❌ Instagram ID is NOT loaded - check your .env file")
    print("\nMake sure this line exists in your .env file:")
    print("INSTAGRAM_BUSINESS_ACCOUNT_ID=17841478244183108")
