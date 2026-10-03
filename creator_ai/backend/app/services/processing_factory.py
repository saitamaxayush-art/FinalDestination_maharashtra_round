from .base_processing import BaseProcessingService
from .mock_processing_service import MockProcessingService

def get_processing_service() -> BaseProcessingService:
    return MockProcessingService()
