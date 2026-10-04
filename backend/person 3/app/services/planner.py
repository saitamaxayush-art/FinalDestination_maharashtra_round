from pydantic import BaseModel
from typing import List, Optional
import re

class EditOperation(BaseModel):
    type: str
    start: Optional[float] = None
    end: Optional[float] = None
    ratio: Optional[str] = None
    factor: Optional[float] = None
    text: Optional[str] = None
    duration: Optional[float] = None
    enabled: Optional[bool] = None

class EditPlanOutput(BaseModel):
    aspect_ratio: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None

class EditPlan(BaseModel):
    operations: List[EditOperation]
    output: Optional[EditPlanOutput] = None

def generate_edit_plan(prompt: str) -> EditPlan:
    # Deterministic parser fallback
    prompt = prompt.lower()
    operations = []
    output = EditPlanOutput()

    if "vertical" in prompt or "tiktok" in prompt or "reel" in prompt or "short" in prompt:
        operations.append(EditOperation(type="aspect_ratio", ratio="9:16"))
        output.aspect_ratio = "9:16"
        output.width = 1080
        output.height = 1920
    elif "square" in prompt:
        operations.append(EditOperation(type="aspect_ratio", ratio="1:1"))
        output.aspect_ratio = "1:1"
        output.width = 1080
        output.height = 1080
    elif "widescreen" in prompt or "youtube video" in prompt:
        operations.append(EditOperation(type="aspect_ratio", ratio="16:9"))
        output.aspect_ratio = "16:9"
        output.width = 1920
        output.height = 1080

    if "cut the first 5 seconds" in prompt:
        operations.append(EditOperation(type="trim", start=5))
    if "30 seconds" in prompt or "30 second" in prompt:
        operations.append(EditOperation(type="trim", start=0, end=30))
    elif "20 seconds" in prompt or "20 second" in prompt:
        operations.append(EditOperation(type="trim", start=0, end=20))
    elif "15 seconds" in prompt or "15 second" in prompt:
        operations.append(EditOperation(type="trim", start=0, end=15))
    elif "10 seconds" in prompt or "10 second" in prompt:
        operations.append(EditOperation(type="trim", start=0, end=10))

    if "speed it up" in prompt or "faster" in prompt:
        operations.append(EditOperation(type="speed", factor=1.5))
    elif "slow this down" in prompt:
        operations.append(EditOperation(type="speed", factor=0.5))

    if "remove sound" in prompt or "remove audio" in prompt or "mute" in prompt:
        operations.append(EditOperation(type="mute"))

    if "captions" in prompt:
        operations.append(EditOperation(type="captions", enabled=True))

    if "title" in prompt:
        text = "My Journey"
        match = re.search(r'title\s+["\']([^"\']+)["\']', prompt, re.IGNORECASE)
        if match:
            text = match.group(1)
        elif "day in my life" in prompt:
            text = "Day in My Life"
        elif "weekend trip" in prompt:
            text = "Weekend Trip"
        operations.append(EditOperation(type="title", text=text, start=0, duration=3))

    return EditPlan(operations=operations, output=output)
