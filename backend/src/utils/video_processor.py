import subprocess
import os
import logging
import imageio_ffmpeg
import re
import tempfile

logger = logging.getLogger(__name__)

def get_video_duration(input_path):
    """
    Get video duration using ffmpeg stderr output.
    """
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    try:
        # ffmpeg -i input_path
        result = subprocess.run([ffmpeg_exe, "-i", input_path], stderr=subprocess.PIPE, stdout=subprocess.PIPE)
        stderr = result.stderr.decode()
        # Look for "Duration: 00:00:00.00"
        match = re.search(r"Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})", stderr)
        if match:
            hours, minutes, seconds = map(float, match.groups())
            total_seconds = hours * 3600 + minutes * 60 + seconds
            return total_seconds
    except Exception as e:
        logger.warning(f"Failed to get video duration: {e}")
    return 0

def prepare_video_for_shorts(input_path, output_path=None):
    """
    Pre-process a video to ensure it meets YouTube Shorts requirements
    """
    if output_path is None:
        fd, output_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
    
    logger.info(f"Processing video for Shorts format: {input_path} -> {output_path}")
    
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    
    # Robust command for YouTube Shorts
    cmd = [
        ffmpeg_exe, "-y",
        "-i", input_path,
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
        "-c:v", "libx264",
        "-preset", "fast",
        "-profile:v", "main",
        "-level", "3.1",
        "-pix_fmt", "yuv420p",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "44100",
        "-movflags", "+faststart",
        "-t", "59.5", # Limit to just under 60s
        output_path
    ]
    
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info(f"Video successfully processed for Shorts format")
        return output_path
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode() if e.stderr else str(e)
        logger.error(f"Failed to process video: {error_msg}")
        return input_path
    except Exception as e:
        logger.error(f"Unexpected error during video processing: {str(e)}")
        return input_path
