from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import asyncio

from app.database import get_db
from app.models.domain import Clip, PlatformVariant, Export, Job, Edit, Asset, Caption
from app.services.renderer import RenderRequest, MockRenderer

router = APIRouter(prefix="/api", tags=["exports"])

class ExportRequest(BaseModel):
    platform_variant_id: int

async def run_render_job(job_id: int, export_id: int, request: RenderRequest):
    from app.database import SessionLocal
    from app.services.renderer import FFmpegRenderer, MockRenderer
    from app.config import settings
    
    db = SessionLocal()
    try:
        renderer = FFmpegRenderer() if getattr(settings, "AI_ENGINE_TYPE", "mock") == "real" else MockRenderer()
        
        export = db.query(Export).filter(Export.id == export_id).first()
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not export or not job:
            return

        job.status = "PROCESSING"
        export.status = "processing"
        db.commit()

        try:
            job.progress = 50.0
            export.progress = 50.0
            db.commit()
            
            result = await renderer.render(request, export.clip_id)
            
            job.progress = 100.0
            job.status = "COMPLETED"
            export.progress = 100.0
            export.status = "completed"
            export.output_path = result.get("output_path")
            db.commit()
        except Exception as e:
            job.status = "FAILED"
            job.error_message = str(e)
            export.status = "failed"
            export.error_message = str(e)
            db.commit()
    finally:
        db.close()

@router.post("/clips/{clip_id}/export", status_code=status.HTTP_202_ACCEPTED)
def export_clip(clip_id: int, request: ExportRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
        
    platform_variant = db.query(PlatformVariant).filter(PlatformVariant.id == request.platform_variant_id).first()
    if not platform_variant:
        raise HTTPException(status_code=404, detail="Platform variant not found")

    # Get source asset
    source_asset = db.query(Asset).filter(Asset.id == clip.source_asset_id).first()
    source_path = source_asset.file_path if source_asset else "unknown"

    # Get edits and captions
    edits = db.query(Edit).filter(Edit.clip_id == clip_id).all()
    captions = db.query(Caption).filter(Caption.clip_id == clip_id).all()

    # Build RenderRequest
    render_req = RenderRequest(
        source_video=source_path,
        start_time=clip.start_time or 0.0,
        end_time=clip.end_time or 0.0,
        aspect_ratio=platform_variant.aspect_ratio or "9:16",
        width=platform_variant.width or 1080,
        height=platform_variant.height or 1920,
        captions=[{"text": c.text, "start_time": c.start_time, "end_time": c.end_time} for c in captions],
        edit_operations=[{"type": e.edit_type, "data": e.edit_data} for e in edits]
    )

    # Create Job
    job = Job(
        project_id=clip.project_id,
        job_type="export",
        status="QUEUED"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Create Export
    export = Export(
        clip_id=clip.id,
        platform_adaptation_id=platform_variant.id,
        job_id=job.id,
        status="pending"
    )
    db.add(export)
    db.commit()
    db.refresh(export)

    background_tasks.add_task(run_render_job, job.id, export.id, render_req)

    return {"export_id": export.id, "job_id": job.id}


@router.get("/exports/{export_id}")
def get_export(export_id: int, db: Session = Depends(get_db)):
    export = db.query(Export).filter(Export.id == export_id).first()
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
        
    return {
        "status": export.status,
        "progress": export.progress,
        "output_path": export.output_path,
        "error_message": export.error_message
    }
