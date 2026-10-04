import os
import asyncio
from app.services.renderer import FFmpegRenderer, RenderRequest, get_ffmpeg_path

ffmpeg_exe = get_ffmpeg_path()

# Create a 15-second test video
os.system(f'"{ffmpeg_exe}" -y -f lavfi -i testsrc=duration=15:size=1280x720:rate=24 -f lavfi -i sine=frequency=1000:duration=15 -c:v libx264 -c:a aac test_15s.mp4')

req = RenderRequest(
    source_video='test_15s.mp4',
    start_time=0.0,
    end_time=10.0,
    aspect_ratio='9:16',
    width=1080,
    height=1920,
    captions=[],
    edit_operations=[
        {'type': 'aspect_ratio', 'data': {'ratio': '9:16'}},
        {'type': 'trim', 'data': {'start': 0.0, 'end': 10.0}},
        {'type': 'mute', 'data': {}},
        {'type': 'title', 'data': {'text': 'My Journey', 'start': 0.0, 'duration': 3.0}}
    ]
)

async def main():
    renderer = FFmpegRenderer()
    res = await renderer.render(req, 999)
    print(res)
    output_path = res['output_path']
    os.system(f'"{ffmpeg_exe}" -i "{output_path}" -hide_banner 2>&1')

asyncio.run(main())
