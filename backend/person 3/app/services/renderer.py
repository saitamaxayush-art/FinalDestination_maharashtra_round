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
        # Simulate rendering output
        return {
            "status": "completed",
            "output_path": f"exports/render_{clip_id}.mp4"
        }

class FFmpegRenderer(BaseRenderer):
    async def render(self, request: RenderRequest, clip_id: int) -> dict:
        import os
        import subprocess
        
        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "exports"))
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"export_{clip_id}.mp4")
        
        duration = max(0.1, request.end_time - request.start_time)
        
        # Calculate aspect ratio padding/scaling
        # Example for 9:16 vertical re-frame
        # Scale to height force aspect ratio, then crop or pad
        vf_filters = f"scale={request.width}:{request.height}:force_original_aspect_ratio=decrease,pad={request.width}:{request.height}:(ow-iw)/2:(oh-ih)/2"
        
        command = [
            "ffmpeg",
            "-y",
            "-ss", str(request.start_time),
            "-i", request.source_video,
            "-t", str(duration),
            "-vf", vf_filters,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-movflags", "+faststart",
            output_path,
        ]
        
        # In a real scenario we'd use asyncio.create_subprocess_exec to avoid blocking
        import asyncio
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {stderr.decode()}")
            
        return {
            "status": "completed",
            "output_path": f"exports/export_{clip_id}.mp4"
        }

