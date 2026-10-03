from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.domain import AssetResponse
from app.services import asset_service

router = APIRouter(prefix="/api", tags=["assets"])

@router.post("/projects/{project_id}/assets", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def upload_asset(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a new asset to a project"""
    return asset_service.create_asset(db, project_id, file)

@router.get("/projects/{project_id}/assets", response_model=List[AssetResponse])
def get_project_assets(project_id: int, db: Session = Depends(get_db)):
    """List all assets for a given project"""
    return asset_service.get_assets_by_project(db, project_id)

@router.get("/assets/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    """Get metadata for a specific asset"""
    return asset_service.get_asset(db, asset_id)
