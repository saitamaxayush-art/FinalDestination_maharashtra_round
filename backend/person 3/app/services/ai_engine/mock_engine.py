from typing import Dict, Any
from app.services.ai_engine.base import BaseAIEngine

class MockAIEngine(BaseAIEngine):
    async def process_content(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns mock AI processing results.
        """
        return {
            "status": "completed",
            "transcript": {
                "segments": [
                    {"start": 0.0, "end": 2.5, "text": "Welcome to CreatorAi."},
                    {"start": 2.5, "end": 5.0, "text": "This is a mock transcript."}
                ]
            },
            "clips": [
                {
                    "start_time": 0.0,
                    "end_time": 5.0,
                    "title": "Mock Clip 1",
                    "score": 0.95,
                    "reason": "High engagement score."
                }
            ],
            "hooks": [
                {
                    "clip_reference": "Mock Clip 1",
                    "text": "Are you ready to create?"
                }
            ],
            "captions": [
                {
                    "clip_reference": "Mock Clip 1",
                    "start_time": 0.0,
                    "end_time": 2.5,
                    "text": "Welcome to CreatorAi."
                }
            ]
        }
