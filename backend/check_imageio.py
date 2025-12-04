import imageio
import os

def check_metadata():
    # Create a dummy mp4 or just check if we can import
    print("imageio imported")
    try:
        # We don't have a video file handy, but let's check if ffmpeg plugin is available
        print("Formats:", imageio.formats)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_metadata()
