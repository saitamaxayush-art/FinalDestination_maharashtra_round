from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseAIEngine(ABC):
    @abstractmethod
    async def process_content(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes content based on the given request.
        """
        pass
