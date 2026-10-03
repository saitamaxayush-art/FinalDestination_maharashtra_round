import os
import subprocess


def format_vertical(input_path, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    command = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=decrease,"
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-movflags", "+faststart",
        output_path,
    ]

    subprocess.run(command, check=True)

    return output_path
