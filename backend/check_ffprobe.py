import imageio_ffmpeg
import os
import subprocess

def check_ffprobe():
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"ffmpeg found at: {ffmpeg_exe}")
    
    # Try to find ffprobe in the same directory
    ffmpeg_dir = os.path.dirname(ffmpeg_exe)
    ffprobe_name = "ffprobe.exe" if os.name == 'nt' else "ffprobe"
    ffprobe_path = os.path.join(ffmpeg_dir, ffprobe_name)
    
    if os.path.exists(ffprobe_path):
        print(f"ffprobe found at: {ffprobe_path}")
        try:
            subprocess.run([ffprobe_path, "-version"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print("ffprobe is executable")
        except Exception as e:
            print(f"Error running ffprobe: {e}")
    else:
        print("ffprobe not found in ffmpeg directory")
        # Try system path
        try:
            subprocess.run(["ffprobe", "-version"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print("ffprobe found in system PATH")
        except:
            print("ffprobe not found in system PATH")

if __name__ == "__main__":
    check_ffprobe()
