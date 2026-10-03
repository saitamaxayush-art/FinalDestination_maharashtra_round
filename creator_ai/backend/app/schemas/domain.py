from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    status: Optional[str] = "draft"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AssetBase(BaseModel):
    name: str
    asset_type: str
    file_path: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[float] = None
    project_id: int

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class AssetResponse(AssetBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ScriptBase(BaseModel):
    content: str
    project_id: int

class ScriptCreate(ScriptBase):
    pass

class ScriptUpdate(BaseModel):
    content: Optional[str] = None
    version: Optional[int] = None

class ScriptResponse(ScriptBase):
    id: int
    version: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class JobBase(BaseModel):
    job_type: str
    status: str
    project_id: int
    progress: Optional[float] = 0.0
    error_message: Optional[str] = None
    result_json: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[float] = None
    error_message: Optional[str] = None
    result_json: Optional[str] = None

class JobResponse(JobBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TranscriptBase(BaseModel):
    project_id: int
    asset_id: Optional[int] = None

class TranscriptCreate(TranscriptBase):
    pass

class TranscriptUpdate(BaseModel):
    asset_id: Optional[int] = None

class TranscriptResponse(TranscriptBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TranscriptSegmentBase(BaseModel):
    transcript_id: int
    start_time: float
    end_time: float
    text: str

class TranscriptSegmentCreate(TranscriptSegmentBase):
    pass

class TranscriptSegmentUpdate(BaseModel):
    text: Optional[str] = None

class TranscriptSegmentResponse(TranscriptSegmentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ClipBase(BaseModel):
    project_id: int
    source_asset_id: Optional[int] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    title: Optional[str] = None
    score: Optional[float] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    video_path: Optional[str] = None

class ClipCreate(ClipBase):
    pass

class ClipUpdate(BaseModel):
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    title: Optional[str] = None
    score: Optional[float] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    video_path: Optional[str] = None

class ClipResponse(ClipBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HookBase(BaseModel):
    clip_id: int
    text: str
    selected: Optional[bool] = False

class HookCreate(HookBase):
    pass

class HookUpdate(BaseModel):
    text: Optional[str] = None
    selected: Optional[bool] = None

class HookResponse(HookBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CaptionBase(BaseModel):
    clip_id: int
    start_time: float
    end_time: float
    text: str

class CaptionCreate(CaptionBase):
    pass

class CaptionUpdate(BaseModel):
    text: Optional[str] = None

class CaptionResponse(CaptionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class EditBase(BaseModel):
    clip_id: int
    edit_type: str
    edit_data: Optional[str] = None

class EditCreate(EditBase):
    pass

class EditUpdate(BaseModel):
    edit_data: Optional[str] = None

class EditResponse(EditBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PlatformVariantBase(BaseModel):
    clip_id: int
    platform: str
    aspect_ratio: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    video_path: Optional[str] = None
    status: Optional[str] = None

class PlatformVariantCreate(PlatformVariantBase):
    pass

class PlatformVariantUpdate(BaseModel):
    status: Optional[str] = None
    video_path: Optional[str] = None

class PlatformVariantResponse(PlatformVariantBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ExportBase(BaseModel):
    clip_id: int
    platform_variant_id: Optional[int] = None
    status: str
    file_path: Optional[str] = None

class ExportCreate(ExportBase):
    pass

class ExportUpdate(BaseModel):
    status: Optional[str] = None
    file_path: Optional[str] = None

class ExportResponse(ExportBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
