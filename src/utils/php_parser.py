import phpserialize

def parse_php_serialized(data: str):
    """Convert PHP serialized string to a Python object."""
    if not data:
        return None
    try:
        parsed = phpserialize.loads(data.encode("utf-8"), decode_strings=True)
    except Exception as e:
        print(f"Failed to parse PHP serialized data: {e}")
        return None

    def convert(obj):
        if isinstance(obj, bytes):
            return obj.decode("utf-8")
        elif isinstance(obj, dict):
            return {convert(k): convert(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert(i) for i in obj]
        return obj

    return convert(parsed)
