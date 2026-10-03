import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.domain import Project, Asset, Clip, PlatformVariant, Job, Export

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test data
    project = Project(name="Test Project")
    db.add(project)
    db.commit()
    
    asset = Asset(project_id=project.id, name="raw.mp4", asset_type="video", file_path="uploads/raw.mp4")
    db.add(asset)
    db.commit()
    
    clip = Clip(project_id=project.id, source_asset_id=asset.id, start_time=1.0, end_time=5.0, status="accepted")
    db.add(clip)
    db.commit()
    
    variant = PlatformVariant(clip_id=clip.id, platform="youtube_shorts", aspect_ratio="9:16")
    db.add(variant)
    db.commit()
    
    yield {"project": project, "asset": asset, "clip": clip, "variant": variant}
    
    Base.metadata.drop_all(bind=engine)

def test_invalid_clip_id(setup_db):
    response = client.post("/api/clips/999/export", json={"platform_variant_id": setup_db["variant"].id})
    assert response.status_code == 404
    assert response.json()["detail"] == "Clip not found"

def test_invalid_platform_variant_id(setup_db):
    response = client.post(f"/api/clips/{setup_db['clip'].id}/export", json={"platform_variant_id": 999})
    assert response.status_code == 404
    assert response.json()["detail"] == "Platform variant not found"

@pytest.mark.asyncio
async def test_valid_export_and_status(setup_db):
    # 1. Start Export
    response = client.post(
        f"/api/clips/{setup_db['clip'].id}/export",
        json={"platform_variant_id": setup_db["variant"].id}
    )
    assert response.status_code == 202
    data = response.json()
    assert "export_id" in data
    assert "job_id" in data
    
    export_id = data["export_id"]
    
    # Allow background tasks to complete
    # In TestClient, background tasks run synchronously after the route returns
    
    # 2. Check Status
    response = client.get(f"/api/exports/{export_id}")
    assert response.status_code == 200
    export_data = response.json()
    
    # TestClient processes background tasks in the same thread right before returning the response
    # So the export should be completed
    assert export_data["status"] == "completed"
    assert export_data["progress"] == 100.0
    assert export_data["output_path"] is not None
    assert f"exports/render_{setup_db['clip'].id}.mp4" in export_data["output_path"]

def test_get_invalid_export():
    response = client.get("/api/exports/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Export not found"
