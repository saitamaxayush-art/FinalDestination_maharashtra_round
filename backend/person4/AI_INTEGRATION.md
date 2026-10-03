# CreatorAI — Person 4 AI Integration

## Main entry point

Person 3 should call:

    from ai.service import process_video

Then:

    result = process_video(
        video_path="path/to/video.mp4",
        output_dir="outputs",
        max_moments=10,
    )

## Response

The result follows the AIProcessResult schema in:

    ai/schemas.py

It contains:

- status
- transcript
- clips

Each clip contains:

- start
- end
- text
- score
- reason
- content_type
- video_path
- subtitled_video_path
- vertical_video_path
- hooks
- caption
- title
- description
- hashtags
- platforms

## Example

    from ai.service import process_video

    result = process_video(
        video_path="/path/to/uploaded/video.mp4",
        output_dir="outputs",
        max_moments=10,
    )

    for clip in result["clips"]:
        print(clip["vertical_video_path"])
        print(clip["hooks"])
        print(clip["caption"])

## Important

Person 3 should use ai.service.process_video() as the integration point.

Do not import individual AI modules unless needed for development/testing.
