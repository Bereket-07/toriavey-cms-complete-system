from src.utils.video_processor import prepare_video_for_shorts, get_video_duration
import os
import requests
import logging

logging.basicConfig(level=logging.INFO)

def test_processing():
    import imageio_ffmpeg
    import subprocess
    
    print("Generating test video...")
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([
        ffmpeg_exe, "-y", "-f", "lavfi", "-i", "testsrc=duration=10:size=1280x720:rate=30", 
        "-c:v", "libx264", "sample.mp4"
    ], check=True)
    
    print("Sample downloaded. Processing...")
    try:
        output = prepare_video_for_shorts("sample.mp4")
        print(f"Processed file: {output}")
        
        if os.path.exists(output):
            size = os.path.getsize(output)
            print(f"Output size: {size} bytes")
            if size > 0:
                print("SUCCESS: Video processed and non-empty.")
                
                # Check duration
                duration = get_video_duration(output)
                print(f"Duration: {duration}s")
            else:
                print("FAILURE: Output file is empty.")
        else:
            print("FAILURE: Output file does not exist.")
            
    except Exception as e:
        print(f"FAILURE: Exception during processing: {e}")

if __name__ == "__main__":
    test_processing()
