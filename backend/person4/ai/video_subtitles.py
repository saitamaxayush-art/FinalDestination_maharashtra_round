import os
import subprocess


def create_subtitle_file(segments, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        for index, segment in enumerate(segments, start=1):
            start = float(segment["start"])
            end = float(segment["end"])
            text = segment["text"].strip()

            def timestamp(seconds):
                hours = int(seconds // 3600)
                minutes = int((seconds % 3600) // 60)
                secs = int(seconds % 60)
                millis = int(round((seconds - int(seconds)) * 1000))

                if millis >= 1000:
                    secs += 1
                    millis = 0

                return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

            f.write(f"{index}\n")
            f.write(f"{timestamp(start)} --> {timestamp(end)}\n")
            f.write(f"{text}\n\n")


def burn_subtitles(video_path, subtitle_path, output_path):
    subtitle_filter = (
        f"subtitles={subtitle_path}:"
        "force_style='FontName=Arial,FontSize=18,"
        "PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00000000,"
        "BorderStyle=1,Outline=2,Shadow=1,"
        "Alignment=2,MarginV=60'"
    )

    command = [
        "ffmpeg",
        "-y",
        "-i",
        video_path,
        "-vf",
        subtitle_filter,
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        output_path,
    ]

    subprocess.run(command, check=True)


def add_subtitles(video_path, segments, output_path):
    subtitle_path = output_path.rsplit(".", 1)[0] + ".srt"

    create_subtitle_file(segments, subtitle_path)
    burn_subtitles(video_path, subtitle_path, output_path)

    return output_path
