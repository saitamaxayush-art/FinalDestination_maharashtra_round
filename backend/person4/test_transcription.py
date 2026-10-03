from ai.transcription.transcriber import Transcriber

video = "test.mp4"

transcriber = Transcriber()
result = transcriber.transcribe(video)

print("Language:", result["language"])
print("Duration:", result["duration"])

for segment in result["segments"]:
    print(
        f"[{segment['start']:.2f}s - {segment['end']:.2f}s] "
        f"{segment['text']}"
    )
