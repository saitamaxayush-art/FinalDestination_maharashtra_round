import pytest
import json
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

def test_ai_integration_flow():
    db = TestingSessionLocal()
    project = Project(name="AI Test Project")
    db.add(project)
    db.commit()
    
    asset = Asset(project_id=project.id, name="vid", asset_type="video", file_path="video.mp4")
    script = Script(project_id=project.id, content="hello script")
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
    job_id = response.json()["job_id"]
    
    db = TestingSessionLocal()
    # Check Job state
    job = db.query(Job).filter(Job.id == job_id).first()
    assert job.status == "COMPLETED"
    assert job.progress == 100.0
    
    result = json.loads(job.result_json)
    assert result["status"] == "completed"
    
    # Check DB tables
    transcript = db.query(Transcript).filter(Transcript.project_id == pid).first()
    assert transcript is not None
    segments = db.query(TranscriptSegment).filter(TranscriptSegment.transcript_id == transcript.id).all()
    assert len(segments) == 2
    assert segments[0].text == "Welcome to CreatorAi."
    
    clip = db.query(Clip).filter(Clip.project_id == pid).first()
    assert clip is not None
    assert clip.title == "Mock Clip 1"
    assert clip.score == 0.95
    
    hooks = db.query(Hook).filter(Hook.clip_id == clip.id).all()
    assert len(hooks) == 1
    assert hooks[0].text == "Are you ready to create?"
    
    captions = db.query(Caption).filter(Caption.clip_id == clip.id).all()
    assert len(captions) == 1
    assert captions[0].text == "Welcome to CreatorAi."
    
    db.close()
