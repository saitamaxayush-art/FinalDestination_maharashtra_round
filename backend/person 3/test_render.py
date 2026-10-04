from app.services.renderer import FFmpegRenderer, RenderRequest
import asyncio
import os

async def main():
    # check if test video exists, if not, find any video
    source_video = r'c:\Users\AMEYA\OneDrive\Desktop\hackathon\BNB\FinalDestination_maharashtra_round\backend\person 3\uploads\exports\test_layer1.mp4'
    if not os.path.exists(source_video):
        # find any mp4 in uploads
        uploads_dir = r'c:\Users\AMEYA\OneDrive\Desktop\hackathon\BNB\FinalDestination_maharashtra_round\backend\person 3\uploads'
        for root, dirs, files in os.walk(uploads_dir):
            for file in files:
                if file.endswith('.mp4'):
                    source_video = os.path.join(root, file)
                    break

    req = RenderRequest(
        source_video=source_video,
        start_time=0.0,
        end_time=10.0,
        aspect_ratio='9:16',
        width=1080,
        height=1920,
        captions=[],
        edit_operations=[
            {'type': 'mute'},
            {'type': 'title', 'data': {'text': 'My Journey'}},
            {'type': 'trim', 'data': {'start': 0.0, 'end': 10.0}}
        ]
    )
    renderer = FFmpegRenderer()
    try:
        res = await renderer.render(req, 999)
        print('Success:', res)
    except Exception as e:
        print('Exception:', str(e))

asyncio.run(main())
