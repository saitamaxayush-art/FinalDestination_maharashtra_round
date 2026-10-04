import os, asyncio
from app.services.renderer import FFmpegRenderer, RenderRequest, get_ffmpeg_path

ffmpeg_exe = get_ffmpeg_path()

# create 32s video
os.system(f'"{ffmpeg_exe}" -y -f lavfi -i testsrc=duration=32:size=1280x720:rate=24 -f lavfi -i sine=frequency=1000:duration=32 -c:v libx264 -c:a aac test_32s.mp4')

req = RenderRequest(
    source_video='test_32s.mp4',
    start_time=0.0,
    end_time=10.0,
    aspect_ratio='9:16',
    width=1080,
    height=1920,
    captions=[],
    edit_operations=[
        {'type': 'title', 'data': {'text': 'My Journey'}}
    ]
)

async def main():
    renderer = FFmpegRenderer()
    res = await renderer.render(req, 888)
    output_path = res['output_path']
    import subprocess
    p = subprocess.run([ffmpeg_exe, '-i', output_path], capture_output=True, text=True)
    for line in p.stderr.split('\n'):
        if 'Duration:' in line:
            print(line.strip())

asyncio.run(main())
