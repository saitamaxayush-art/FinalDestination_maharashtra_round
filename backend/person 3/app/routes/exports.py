from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import asyncio
import os

from app.database import get_db
from app.models.domain import Clip, PlatformVariant, Export, Job, Edit, Asset, Caption
from app.services.renderer import RenderRequest, MockRenderer

router = APIRouter(prefix="/api", tags=["exports"])

class ExportRequest(BaseModel):
    platform_variant_id: int
    prompt: Optional[str] = None
    source_asset_id: Optional[int] = None

class PlanRequest(BaseModel):
    prompt: str

class DemoExportRequest(BaseModel):
    source_video: str
    start_time: float = 0.0
    end_time: float = 2.0

@router.post("/planner")
def create_plan(request: PlanRequest):
    from app.services.planner import generate_edit_plan
    plan = generate_edit_plan(request.prompt)
    return plan.model_dump()

async def run_render_job(job_id: int, export_id: int, request: RenderRequest):
    from app.database import SessionLocal
    from app.services.renderer import FFmpegRenderer
    
    db = SessionLocal()
    try:
        # Phase 2: NEVER silently fall back to MockRenderer for actual exports.
        renderer = FFmpegRenderer()
        
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
            import traceback
            traceback.print_exc()
            error_msg = str(e) or repr(e) or "Export failed with an unknown server error"
            job.status = "FAILED"
            job.error_message = error_msg
            export.status = "failed"
            export.error_message = error_msg
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
    active_asset_id = request.source_asset_id if request.source_asset_id else clip.source_asset_id
    source_asset = db.query(Asset).filter(Asset.id == active_asset_id).first()
    source_path = source_asset.file_path if source_asset else "unknown"

    edits = db.query(Edit).filter(Edit.clip_id == clip_id).all()
    captions = db.query(Caption).filter(Caption.clip_id == clip_id).all()

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

    if request.prompt:
        from app.services.planner import generate_edit_plan
        plan = generate_edit_plan(request.prompt)
        
        if plan.output:
            if plan.output.aspect_ratio:
                render_req.aspect_ratio = plan.output.aspect_ratio
            if plan.output.width:
                render_req.width = plan.output.width
            if plan.output.height:
                render_req.height = plan.output.height
                
        for op in plan.operations:
            op_dict = op.model_dump(exclude_none=True)
            op_type = op_dict.pop("type")
            render_req.edit_operations.append({
                "type": op_type,
                "data": op_dict
            })
            if op_type == "trim":
                if "start" in op_dict:
                    render_req.start_time = float(op_dict["start"])
                if "end" in op_dict:
                    render_req.end_time = float(op_dict["end"])

    job = Job(
        project_id=clip.project_id,
        job_type="export",
        status="QUEUED"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

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
        
    output_url = None
    if export.output_path:
        filename = os.path.basename(export.output_path)
        output_url = f"/exports/{filename}"
        
    return {
        "status": export.status,
        "progress": export.progress,
        "output_path": export.output_path,
        "output_url": output_url,
        "error_message": export.error_message
    }

@router.post("/demo")
async def demo_export(request: DemoExportRequest):
    from app.services.renderer import FFmpegRenderer, RenderRequest
    
    source_path = request.source_video
    if source_path.startswith('blob:') or source_path.startswith('data:'):
        source_path = "/fake/path/from/blob.mp4"
    elif not os.path.isabs(source_path):
        pass

    renderer = FFmpegRenderer()
    req = RenderRequest(
        source_video=source_path,
        start_time=request.start_time,
        end_time=request.end_time,
        aspect_ratio="9:16",
        width=1080,
        height=1920,
        captions=[],
        edit_operations=[]
    )
    
    try:
        res = await renderer.render(req, 999)
        output_path = res.get("output_path")
        filename = os.path.basename(output_path)
        return {"status": "completed", "output_url": f"/exports/{filename}"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
