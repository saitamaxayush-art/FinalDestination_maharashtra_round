import os
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.domain import Asset
from app.services.project_service import get_project

UPLOAD_DIR = "uploads"

def create_asset(db: Session, project_id: int, file: UploadFile):
    get_project(db, project_id) # ensure project exists

    if not file.content_type.startswith(("video/", "audio/", "image/", "text/")):
        raise HTTPException(status_code=400, detail="Invalid file type")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    file_size = 0
    with open(file_path, "wb") as buffer:
        while chunk := file.file.read(1024 * 1024): # 1MB chunks
            buffer.write(chunk)
            file_size += len(chunk)

    asset_type = file.content_type.split("/")[0]

    db_asset = Asset(
        project_id=project_id,
        name=file.filename or unique_filename,
        asset_type=asset_type,
        file_path=file_path,
        mime_type=file.content_type,
        file_size=file_size
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

def get_assets_by_project(db: Session, project_id: int):
    get_project(db, project_id) # ensure project exists
    return db.query(Asset).filter(Asset.project_id == project_id).all()

def get_asset(db: Session, asset_id: int):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
