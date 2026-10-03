from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.schemas.job import ProcessRequest, ProcessResponse, JobStatusResponse
from app.models.domain import Job, Project, Asset, Script
from app.services.processing_factory import get_processing_service

router = APIRouter(prefix="/api", tags=["jobs"])

# This allows tests to patch SessionLocal so background tasks use memory db
def get_bg_session() -> Session:
    return SessionLocal()

async def background_process(job_id: int, request_data: dict):
    db = get_bg_session()
    try:
        service = get_processing_service()
        await service.process_content(job_id, request_data, db)
    finally:
        db.close()

@router.post("/projects/{project_id}/process", response_model=ProcessResponse, status_code=status.HTTP_202_ACCEPTED)
def process_content(project_id: int, request: ProcessRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Validate project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Validate asset
    asset = db.query(Asset).filter(Asset.id == request.video_asset_id, Asset.project_id == project_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Video asset not found in project")
        
    # Validate script
    script = db.query(Script).filter(Script.id == request.script_id, Script.project_id == project_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found in project")
        
    # Create Job
    job = Job(
        project_id=project_id,
        job_type="content_processing",
        status="QUEUED",
        progress=0.0
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Trigger background task
    background_tasks.add_task(background_process, job.id, request.model_dump())
    
    return ProcessResponse(job_id=job.id, status=job.status)

@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatusResponse(
        id=job.id,
        type=job.job_type,
        status=job.status,
        progress=job.progress,
        error=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at
    )
