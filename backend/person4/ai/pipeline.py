import os

from ai.transcription.transcriber import Transcriber
from ai.analysis.moment_detector import detect_moments
from ai.clipping.clip_generator import generate_clip
from ai.generation.hook_generator import generate_hooks
from ai.generation.caption_generator import generate_caption
from ai.generation.metadata_generator import generate_metadata
from ai.platform.adapter import adapt_for_platforms
from ai.video.subtitle_generator import add_subtitles
from ai.video.vertical_formatter import format_vertical


class CreatorAIPipeline:
    def __init__(self, whisper_model: str = "small"):
        self.transcriber = Transcriber(model_size=whisper_model)

    def process_video(
        self,
        video_path: str,
        output_dir: str = "outputs",
        max_moments: int = 10,
    ) -> dict:

        os.makedirs(output_dir, exist_ok=True)

        # 1. Video -> transcript
        transcript = self.transcriber.transcribe(video_path)

        # 2. Transcript -> important moments
        moments = detect_moments(
            transcript,
            max_moments=max_moments,
        )

        clips = []

        for index, moment in enumerate(moments, start=1):

            clip_path = os.path.join(
                output_dir,
                f"clip_{index:03d}.mp4",
            )

            subtitled_path = os.path.join(
                output_dir,
                f"clip_{index:03d}_subtitled.mp4",
            )

            vertical_path = os.path.join(
                output_dir,
                f"clip_{index:03d}_vertical.mp4",
            )

            # 3. Generate clip
            generate_clip(
                video_path,
                moment["start"],
                moment["end"],
                clip_path,
            )

            # 4. Burn subtitles
            add_subtitles(
                clip_path,
                subtitled_path,
                transcript["segments"],
                moment["start"],
            )

            # 5. Convert to 1080x1920 vertical format
            format_vertical(
                subtitled_path,
                vertical_path,
            )

            # 6. Generate AI metadata
            metadata = generate_metadata(moment)

            # 7. Generate platform-specific metadata
            platforms = adapt_for_platforms(moment)

            # 8. Generate hooks and caption
            hooks = generate_hooks(moment)
            caption = generate_caption(moment)

            item = {
                **moment,

                "video_path": clip_path,
                "subtitled_video_path": subtitled_path,
                "vertical_video_path": vertical_path,

                "hooks": hooks,
                "caption": caption,

                **metadata,

                "platforms": platforms,
            }

            clips.append(item)

        return {
            "status": "completed",
            "transcript": transcript["segments"],
            "clips": clips,
        }
