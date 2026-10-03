from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class ProcessRequest(BaseModel):
    video_asset_id: int
    script_id: int
    options: Dict[str, Any]

class ProcessResponse(BaseModel):
    job_id: int
    status: str

class JobStatusResponse(BaseModel):
    id: int
    type: str
    status: str
    progress: float
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
