from sqlalchemy.orm import Session
from app.models.domain import Project
from app.schemas.domain import ProjectCreate, ProjectUpdate
from fastapi import HTTPException

def get_project(db: Session, project_id: int):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: ProjectCreate):
    db_project = Project(name=project.name, status=project.status or "draft")
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project
