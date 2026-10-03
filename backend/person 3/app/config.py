import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CreatorAi Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./creatorai.db"
    
    # AI Engine Settings
    AI_ENGINE_TYPE: str = "mock"  # "mock" or "real"
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    GENERATED_DIR: str = "generated"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()