import os
import subprocess


def generate_clip(
    video_path: str,
    start: float,
    end: float,
    output_path: str,
) -> str:
    """Create a clip with FFmpeg.

    Re-encodes for reliable, frame-accurate output.
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    duration = max(0.1, end - start)

    command = [
        "ffmpeg",
        "-y",
        "-ss", str(start),
        "-i", video_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-movflags", "+faststart",
        output_path,
    ]

    subprocess.run(command, check=True)
    return output_path
