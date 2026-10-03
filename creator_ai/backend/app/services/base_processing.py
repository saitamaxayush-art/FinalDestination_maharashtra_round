from abc import ABC, abstractmethod
from sqlalchemy.orm import Session
from typing import Dict, Any

class BaseProcessingService(ABC):
    @abstractmethod
    async def process_content(self, job_id: int, request_data: Dict[str, Any], db: Session) -> None:
        """Process content for a given job asynchronously."""
        pass
