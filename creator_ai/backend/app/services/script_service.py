import os
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.domain import Script
from app.schemas.domain import ScriptCreate, ScriptUpdate
from app.services.project_service import get_project

def create_script_from_text(db: Session, project_id: int, script_create: ScriptCreate):
    get_project(db, project_id) # ensure project exists
    db_script = Script(
        project_id=project_id,
        content=script_create.content
    )
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script

def create_script_from_file(db: Session, project_id: int, file: UploadFile):
    get_project(db, project_id)
    if not file.content_type.startswith("text/"):
        raise HTTPException(status_code=400, detail="Script must be a text file")
    
    content = file.file.read().decode("utf-8")
    db_script = Script(
        project_id=project_id,
        content=content
    )
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script

def get_latest_script(db: Session, project_id: int):
    get_project(db, project_id)
    script = db.query(Script).filter(Script.project_id == project_id).order_by(Script.version.desc(), Script.id.desc()).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found for this project")
    return script

def update_script(db: Session, script_id: int, script_update: ScriptUpdate):
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    if script_update.content is not None:
        script.content = script_update.content
    if script_update.version is not None:
        script.version = script_update.version
    else:
        script.version += 1
        
    db.commit()
    db.refresh(script)
    return script
