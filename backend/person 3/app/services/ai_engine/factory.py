from app.config import settings
from app.services.ai_engine.base import BaseAIEngine
from app.services.ai_engine.mock_engine import MockAIEngine
from app.services.ai_engine.real_engine import RealAIEngine

def get_ai_engine() -> BaseAIEngine:
    engine_type = getattr(settings, "AI_ENGINE_TYPE", "mock")
    if engine_type == "real":
        return RealAIEngine()
    return MockAIEngine()
