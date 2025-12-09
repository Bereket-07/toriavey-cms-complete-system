try:
    import composio
    print(f"Composio version: {composio.__version__}")
except Exception as e:
    print(f"Error importing composio: {e}")

try:
    from composio.exceptions import InvalidParams
    print("InvalidParams found in composio.exceptions")
except ImportError:
    print("InvalidParams NOT found in composio.exceptions")
    import composio.exceptions
    print(f"Available exceptions: {dir(composio.exceptions)}")
