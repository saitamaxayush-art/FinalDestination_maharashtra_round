from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.domain import ScriptCreate, ScriptResponse, ScriptUpdate
from app.services import script_service

router = APIRouter(prefix="/api", tags=["scripts"])

@router.post("/projects/{project_id}/script", response_model=ScriptResponse, status_code=status.HTTP_201_CREATED)
def create_script(project_id: int, content: Optional[str] = Form(None), file: Optional[UploadFile] = File(None), db: Session = Depends(get_db)):
    """Create a script for a project from text or file upload"""
    if file:
        return script_service.create_script_from_file(db, project_id, file)
    elif content:
        script_create = ScriptCreate(content=content, project_id=project_id)
        return script_service.create_script_from_text(db, project_id, script_create)
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Must provide script content or file")

@router.get("/projects/{project_id}/script", response_model=ScriptResponse)
def get_latest_script(project_id: int, db: Session = Depends(get_db)):
    """Get the latest script for a project"""
    return script_service.get_latest_script(db, project_id)

@router.put("/scripts/{script_id}", response_model=ScriptResponse)
def update_script(script_id: int, script_update: ScriptUpdate, db: Session = Depends(get_db)):
    """Update an existing script"""
    return script_service.update_script(db, script_id, script_update)
