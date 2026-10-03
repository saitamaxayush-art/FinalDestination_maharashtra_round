import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.domain import *
import app.routes.jobs as jobs_routes

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_bg_session():
    return TestingSessionLocal()
jobs_routes.get_bg_session = override_get_bg_session

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_process_content_invalid_entities():
    response = client.post(
        "/api/projects/999/process",
        json={
            "video_asset_id": 999,
            "script_id": 999,
            "options": {"generate_clips": True}
        }
    )
    assert response.status_code == 404

def test_process_content_valid():
    db = TestingSessionLocal()
    project = Project(name="Job Test Project")
    db.add(project)
    db.commit()
    
    asset = Asset(project_id=project.id, name="vid", asset_type="video", file_path="x")
    script = Script(project_id=project.id, content="hello")
    db.add_all([asset, script])
    db.commit()
    
    pid = project.id
    aid = asset.id
    sid = script.id
    db.close()
    
    response = client.post(
        f"/api/projects/{pid}/process",
        json={
            "video_asset_id": aid,
            "script_id": sid,
            "options": {"generate_clips": True}
        }
    )
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "QUEUED"
    job_id = data["job_id"]
    
    response2 = client.get(f"/api/jobs/{job_id}")
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["status"] in ["COMPLETED", "PROCESSING", "QUEUED"]
