from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    status = Column(String, default="draft", index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assets = relationship("Asset", back_populates="project", cascade="all, delete-orphan")
    scripts = relationship("Script", back_populates="project", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="project", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="project", cascade="all, delete-orphan")
    clips = relationship("Clip", back_populates="project", cascade="all, delete-orphan")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    mime_type = Column(String)
    file_size = Column(Integer)
    duration = Column(Float)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="assets")
    transcripts = relationship("Transcript", back_populates="asset")
    clips_as_source = relationship("Clip", back_populates="source_asset")

class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="scripts")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    job_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    progress = Column(Float, default=0.0)
    error_message = Column(Text)
    result_json = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="jobs")

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="SET NULL"), index=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="transcripts")
    asset = relationship("Asset", back_populates="transcripts")
    segments = relationship("TranscriptSegment", back_populates="transcript", cascade="all, delete-orphan")

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id", ondelete="CASCADE"), index=True, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)

    transcript = relationship("Transcript", back_populates="segments")

class Clip(Base):
    __tablename__ = "clips"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    source_asset_id = Column(Integer, ForeignKey("assets.id", ondelete="SET NULL"), index=True, nullable=True)
    start_time = Column(Float)
    end_time = Column(Float)
    title = Column(String)
    score = Column(Float)
    reason = Column(Text)
    status = Column(String)
    video_path = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="clips")
    source_asset = relationship("Asset", back_populates="clips_as_source")
    hooks = relationship("Hook", back_populates="clip", cascade="all, delete-orphan")
    captions = relationship("Caption", back_populates="clip", cascade="all, delete-orphan")
    edits = relationship("Edit", back_populates="clip", cascade="all, delete-orphan")
    platform_variants = relationship("PlatformVariant", back_populates="clip", cascade="all, delete-orphan")
    exports = relationship("Export", back_populates="clip", cascade="all, delete-orphan")

class Hook(Base):
    __tablename__ = "hooks"

    id = Column(Integer, primary_key=True, index=True)
    clip_id = Column(Integer, ForeignKey("clips.id", ondelete="CASCADE"), index=True, nullable=False)
    text = Column(Text, nullable=False)
    selected = Column(Boolean, default=False)

    clip = relationship("Clip", back_populates="hooks")

class Caption(Base):
    __tablename__ = "captions"

    id = Column(Integer, primary_key=True, index=True)
    clip_id = Column(Integer, ForeignKey("clips.id", ondelete="CASCADE"), index=True, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)

    clip = relationship("Clip", back_populates="captions")

class Edit(Base):
    __tablename__ = "edits"

    id = Column(Integer, primary_key=True, index=True)
    clip_id = Column(Integer, ForeignKey("clips.id", ondelete="CASCADE"), index=True, nullable=False)
    edit_type = Column(String, nullable=False)
    edit_data = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    clip = relationship("Clip", back_populates="edits")

class PlatformVariant(Base):
    __tablename__ = "platform_variants"

    id = Column(Integer, primary_key=True, index=True)
    clip_id = Column(Integer, ForeignKey("clips.id", ondelete="CASCADE"), index=True, nullable=False)
    platform = Column(String, nullable=False)
    aspect_ratio = Column(String)
    width = Column(Integer)
    height = Column(Integer)
    title = Column(String)
    description = Column(Text)
    caption = Column(Text)
    hashtags = Column(String)
    video_path = Column(String)
    status = Column(String)

    clip = relationship("Clip", back_populates="platform_variants")
    exports = relationship("Export", back_populates="platform_variant")

class Export(Base):
    __tablename__ = "exports"

    id = Column(Integer, primary_key=True, index=True)
    clip_id = Column(Integer, ForeignKey("clips.id", ondelete="CASCADE"), index=True, nullable=False)
    platform_variant_id = Column(Integer, ForeignKey("platform_variants.id", ondelete="SET NULL"), index=True, nullable=True)
    status = Column(String, nullable=False)
    file_path = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    clip = relationship("Clip", back_populates="exports")
    platform_variant = relationship("PlatformVariant", back_populates="exports")
