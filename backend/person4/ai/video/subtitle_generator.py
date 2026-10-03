import os
import subprocess
import tempfile


def add_subtitles(input_path, output_path, transcript_segments, clip_start):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    subtitle_file = tempfile.NamedTemporaryFile(
        suffix=".srt",
        delete=False,
        mode="w",
        encoding="utf-8",
    )

    try:
        index = 1

        for segment in transcript_segments:
            start = float(segment["start"])
            end = float(segment["end"])

            if end <= clip_start:
                continue

            text = segment["text"].strip()

            local_start = max(0, start - clip_start)
            local_end = max(0, end - clip_start)

            if local_end <= 0:
                continue

            def srt_time(seconds):
                hours = int(seconds // 3600)
                minutes = int((seconds % 3600) // 60)
                secs = int(seconds % 60)
                millis = int((seconds - int(seconds)) * 1000)

                return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

            subtitle_file.write(
                f"{index}\n"
                f"{srt_time(local_start)} --> {srt_time(local_end)}\n"
                f"{text}\n\n"
            )

            index += 1

        subtitle_file.close()

        command = [
            "ffmpeg",
            "-y",
            "-i", input_path,
            "-vf", f"subtitles={subtitle_file.name}",
            "-c:v", "libx264",
            "-c:a", "aac",
            "-movflags", "+faststart",
            output_path,
        ]

        subprocess.run(command, check=True)

        return output_path

    finally:
        try:
            os.unlink(subtitle_file.name)
        except FileNotFoundError:
            pass
