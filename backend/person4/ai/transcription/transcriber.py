from faster_whisper import WhisperModel


class Transcriber:
    def __init__(
        self,
        model_size: str = "small",
        device: str = "cpu",
        compute_type: str = "int8",
    ):
        self.model = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
        )

    def transcribe(self, video_path: str) -> dict:
        segments, info = self.model.transcribe(video_path)

        transcript = []
        for segment in segments:
            transcript.append(
                {
                    "start": float(segment.start),
                    "end": float(segment.end),
                    "text": segment.text.strip(),
                }
            )

        return {
            "language": info.language,
            "duration": float(info.duration) if info.duration else None,
            "segments": transcript,
        }
