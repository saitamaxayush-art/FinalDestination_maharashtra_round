from typing import List, Dict, Any
from pydantic import BaseModel


class PlatformContent(BaseModel):
    title: str
    caption: str
    hashtags: List[str]


class ClipResult(BaseModel):
    start: float
    end: float
    text: str
    score: float
    reason: str
    content_type: str

    video_path: str
    subtitled_video_path: str
    vertical_video_path: str

    hooks: List[str]
    caption: str
    title: str
    description: str
    hashtags: List[str]

    platforms: Dict[str, PlatformContent]


class AIProcessResult(BaseModel):
    status: str
    transcript: List[Dict[str, Any]]
    clips: List[ClipResult]
