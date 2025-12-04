from composio import ComposioToolSet
import src.config
import json

def check_tokens():
    toolset = ComposioToolSet()
    connections = toolset.get_connected_accounts()
    
    print(f"Found {len(connections)} connections.")
    
    for conn in connections:
        # Inspect the connection object to see if it has tokens
        # We'll print keys/dir to avoid leaking full secrets in logs if possible, 
        # but we need to know if 'accessToken' is there.
        print(f"\nConnection: {conn.appName if hasattr(conn, 'appName') else 'Unknown'}")
        
        # Try to convert to dict if possible
        try:
            if hasattr(conn, 'model_dump'):
                data = conn.model_dump()
            elif hasattr(conn, '__dict__'):
                data = conn.__dict__
            else:
                data = str(conn)
            
            # Check for token-like keys
            keys = data.keys() if isinstance(data, dict) else []
            print(f"Keys: {list(keys)}")
            
            if 'accessToken' in keys or 'access_token' in keys:
                print("Access token FOUND!")
            else:
                print("Access token NOT found in top-level keys.")
                
        except Exception as e:
            print(f"Error inspecting connection: {e}")

if __name__ == "__main__":
    check_tokens()
