from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from abc import ABC, abstractmethod

class RenderRequest(BaseModel):
    source_video: str
    start_time: float
    end_time: float
    aspect_ratio: str
    width: int
    height: int
    captions: List[Dict[str, Any]]
    edit_operations: List[Dict[str, Any]]

class BaseRenderer(ABC):
    @abstractmethod
    async def render(self, request: RenderRequest, clip_id: int) -> dict:
        pass

class MockRenderer(BaseRenderer):
    async def render(self, request: RenderRequest, clip_id: int) -> dict:
        return {
            "status": "completed",
            "output_path": f"exports/render_{clip_id}.mp4"
        }

def get_ffmpeg_path() -> str:
    import os
    import shutil
    
    if "FFMPEG_PATH" in os.environ:
        return os.environ["FFMPEG_PATH"]
        
    ffmpeg_exe = shutil.which("ffmpeg")
    if ffmpeg_exe:
        return ffmpeg_exe
        
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
        
    ffmpeg_static = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "node_modules", "ffmpeg-static", "ffmpeg.exe"))
    if os.path.exists(ffmpeg_static):
        return ffmpeg_static
        
    raise FileNotFoundError("FFmpeg executable not found in FFMPEG_PATH, system PATH, imageio-ffmpeg, or ffmpeg-static.")

class FFmpegRenderer(BaseRenderer):
    async def render(self, request: RenderRequest, clip_id: int) -> dict:
        import os
        import subprocess
        import asyncio
        
        ffmpeg_path = get_ffmpeg_path()
        
        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "exports"))
        os.makedirs(output_dir, exist_ok=True)
        output_file_name = f"export_{clip_id}.mp4"
        output_path = os.path.join(output_dir, output_file_name)
        
        source_video = request.source_video
        
        if not source_video or source_video == "unknown" or not os.path.exists(source_video):
            raise FileNotFoundError(f"Input video not found: {source_video}")
                
        source_video = os.path.abspath(source_video)
        
        duration = max(0.1, request.end_time - request.start_time)
        
        # Check source video duration safely using ffmpeg (ffprobe might not be available)
        try:
            import subprocess
            p = subprocess.run(
                [ffmpeg_path, "-i", source_video],
                capture_output=True
            )
            stderr = p.stderr
            
            # parse duration from stderr
            import re
            match = re.search(r"Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)", stderr.decode())
            if match:
                h, m, s = match.groups()
                source_duration = float(h) * 3600 + float(m) * 60 + float(s)
                
                # If the requested duration is longer than the available footage (with a small 0.1s margin for inaccuracies)
                if duration > source_duration + 0.1:
                    raise ValueError(f"Source video is shorter ({source_duration:.1f}s) than the requested duration ({duration:.1f}s). Cannot extend video without duplicating footage.")
        except ValueError as e:
            raise e
        except Exception:
            pass # fallback if ffmpeg fails to parse duration
        
        vf_filters = [f"scale={request.width}:{request.height}:force_original_aspect_ratio=increase", f"crop={request.width}:{request.height}"]
        af_filters = []
        
        speed_factor = 1.0
        mute = False
        
        for op in request.edit_operations:
            op_type = op.get("type")
            data = op.get("data", {})
            if op_type == "speed":
                factor = data.get("factor", 1.0)
                speed_factor = factor
                vf_filters.append(f"setpts={1.0/factor}*PTS")
                af_filters.append(f"atempo={factor}")
            elif op_type == "mute":
                mute = True
            elif op_type == "title":
                text = data.get("text", "Title")
                escaped_text = text.replace("'", "\\\\'")
                vf_filters.append(rf"drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='{escaped_text}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)/2")

        if mute:
            af_filters = []
            
        vf_str = ",".join(vf_filters)
        
        command = [
            ffmpeg_path,
            "-y",
            "-ss", str(request.start_time),
            "-i", source_video,
            "-t", str(duration),
            "-vf", vf_str
        ]
        
        if mute:
            command.extend(["-an"])
        elif af_filters:
            af_str = ",".join(af_filters)
            command.extend(["-af", af_str, "-c:a", "aac"])
        else:
            command.extend(["-c:a", "aac"])
            
        command.extend([
            "-c:v", "libx264",
            "-movflags", "+faststart",
            output_path
        ])
        
        import subprocess
        process = subprocess.run(
            command,
            capture_output=True
        )
        stdout, stderr = process.stdout, process.stderr
        
        if process.returncode != 0:
            err_output = stderr.decode()
            # Extract only the actual error, skipping the giant FFmpeg build configuration block
            err_lines = [line for line in err_output.split("\n") if line.strip() and not line.startswith("  ")]
            useful_error = "\n".join(err_lines[-5:]) if len(err_lines) > 5 else err_output
            raise RuntimeError(f"FFmpeg failed: {useful_error}")
            
        if not os.path.exists(output_path):
            raise FileNotFoundError("FFmpeg finished but output file was not found")
            
        if os.path.getsize(output_path) == 0:
            os.remove(output_path)
            raise ValueError("FFmpeg produced an empty file")
            
        return {
            "status": "completed",
            "output_path": output_path,
            "output_url": f"/exports/{output_file_name}"
        }
