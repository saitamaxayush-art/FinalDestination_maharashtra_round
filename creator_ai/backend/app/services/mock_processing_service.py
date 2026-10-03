import asyncio
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.services.base_processing import BaseProcessingService
from app.models.domain import Job

class MockProcessingService(BaseProcessingService):
    async def process_content(self, job_id: int, request_data: Dict[str, Any], db: Session) -> None:
        """Simulate processing by updating job status and progress over time."""
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return
        
        try:
            job.status = "PROCESSING"
            db.commit()
            
            # Simulate work
            for i in range(1, 11):
                await asyncio.sleep(0.05) # Fast simulation for tests
                job.progress = i * 10.0
                db.commit()
                
            job.status = "COMPLETED"
            db.commit()
        except Exception as e:
            job.status = "FAILED"
            job.error_message = str(e)
            db.commit()
