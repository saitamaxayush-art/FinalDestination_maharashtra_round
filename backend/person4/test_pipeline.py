from ai.pipeline import CreatorAIPipeline

pipeline = CreatorAIPipeline(whisper_model="small")
result = pipeline.process_video("test.mp4", output_dir="outputs")

print("Status:", result["status"])
print("Transcript segments:", len(result["transcript"]))
print("Clips:", len(result["clips"]))

for clip in result["clips"]:
    print(clip["video_path"])
    print(clip["hooks"])
    print(clip["caption"])
