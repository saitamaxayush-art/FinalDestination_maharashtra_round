import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.domain import Project, Asset, Clip, Job

@pytest.fixture(scope="module")
def engine():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_create_and_read_project(db_session):
    new_project = Project(name="Test Project")
    db_session.add(new_project)
    db_session.commit()
    
    project = db_session.query(Project).filter_by(name="Test Project").first()
    assert project is not None
    assert project.id is not None
    assert project.status == "draft"

def test_create_and_read_asset(db_session):
    new_project = Project(name="Asset Project")
    db_session.add(new_project)
    db_session.commit()
    
    new_asset = Asset(project_id=new_project.id, name="Video 1", asset_type="video", file_path="/path/to/video.mp4")
    db_session.add(new_asset)
    db_session.commit()
    
    asset = db_session.query(Asset).filter_by(name="Video 1").first()
    assert asset is not None
    assert asset.project_id == new_project.id

def test_create_and_read_clip(db_session):
    new_project = Project(name="Clip Project")
    db_session.add(new_project)
    db_session.commit()
    
    new_asset = Asset(project_id=new_project.id, name="Video 2", asset_type="video", file_path="/path/to/video2.mp4")
    db_session.add(new_asset)
    db_session.commit()
    
    new_clip = Clip(project_id=new_project.id, source_asset_id=new_asset.id, start_time=0.0, end_time=10.0, title="Intro")
    db_session.add(new_clip)
    db_session.commit()
    
    clip = db_session.query(Clip).filter_by(title="Intro").first()
    assert clip is not None
    assert clip.source_asset_id == new_asset.id

def test_create_and_read_job(db_session):
    new_project = Project(name="Job Project")
    db_session.add(new_project)
    db_session.commit()
    
    new_job = Job(project_id=new_project.id, job_type="transcribe", status="running", progress=50.0)
    db_session.add(new_job)
    db_session.commit()
    
    job = db_session.query(Job).filter_by(job_type="transcribe").first()
    assert job is not None
    assert job.status == "running"
    assert job.progress == 50.0
