import json

try:
    with open('schema_output.json', 'r', encoding='utf-16-le') as f:
        content = f.read()
    
    # It might contain some garbage at the beginning if it was mixed with stdout
    # But let's try to parse it or just write it back as utf-8
    with open('schema_output_utf8.json', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Converted successfully")
except Exception as e:
    print(f"Error: {e}")
