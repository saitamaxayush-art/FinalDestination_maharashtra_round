from .base_processing import BaseProcessingService
from .processing_service import ProcessingService

def get_processing_service() -> BaseProcessingService:
    return ProcessingService()
