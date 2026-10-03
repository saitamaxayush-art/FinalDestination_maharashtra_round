import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.domain import *

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_create_project():
    response = client.post(
        "/api/projects",
        json={"name": "API Test Project"}
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "API Test Project"
    assert "id" in data
    return data["id"]

def test_get_projects():
    project_id = test_create_project()
    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

def test_upload_asset():
    project_id = test_create_project()
    file_content = b"fake video content"
    response = client.post(
        f"/api/projects/{project_id}/assets",
        files={"file": ("test_video.mp4", file_content, "video/mp4")}
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "test_video.mp4"
    assert data["asset_type"] == "video"
    assert data["mime_type"] == "video/mp4"

def test_create_script_text():
    project_id = test_create_project()
    response = client.post(
        f"/api/projects/{project_id}/script",
        data={"content": "Hello world", "project_id": project_id}
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["content"] == "Hello world"
    assert data["version"] == 1

def test_create_script_file():
    project_id = test_create_project()
    file_content = b"File script content"
    response = client.post(
        f"/api/projects/{project_id}/script",
        files={"file": ("script.txt", file_content, "text/plain")}
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["content"] == "File script content"
