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
