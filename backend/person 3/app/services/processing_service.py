import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.services.base_processing import BaseProcessingService
from app.services.ai_engine.factory import get_ai_engine
from app.models.domain import Job, Project, Asset, Script, Transcript, TranscriptSegment, Clip, Hook, Caption

class ProcessingService(BaseProcessingService):
    async def process_content(self, job_id: int, request_data: Dict[str, Any], db: Session) -> None:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return
            
        try:
            job.status = "PROCESSING"
            job.progress = 10.0
            db.commit()
            
            project = db.query(Project).filter(Project.id == job.project_id).first()
            asset = db.query(Asset).filter(Asset.id == request_data.get("video_asset_id")).first()
            script = db.query(Script).filter(Script.id == request_data.get("script_id")).first()
            
            request = {
                "job_id": str(job.id),
                "project_id": str(job.project_id),
                "video_path": asset.file_path if asset else "",
                "script_text": script.content if script else "",
                "options": request_data.get("options", {})
            }
            
            ai_engine = get_ai_engine()
            response = await ai_engine.process_content(request)
            
            # DB writes inside a transaction
            transcript_data = response.get("transcript", {})
            transcript = Transcript(project_id=job.project_id, asset_id=asset.id if asset else None)
            db.add(transcript)
            db.flush()
            
            for seg in transcript_data.get("segments", []):
                segment = TranscriptSegment(
                    transcript_id=transcript.id,
                    start_time=seg["start"],
                    end_time=seg["end"],
                    text=seg["text"]
                )
                db.add(segment)
                
            clips_data = response.get("clips", [])
            hooks_data = response.get("hooks", [])
            captions_data = response.get("captions", [])
            
            for c in clips_data:
                clip = Clip(
                    project_id=job.project_id,
                    source_asset_id=asset.id if asset else None,
                    start_time=c["start_time"],
                    end_time=c["end_time"],
                    title=c["title"],
                    score=c["score"],
                    reason=c["reason"],
                    status="generated"
                )
                db.add(clip)
                db.flush()
                
                for h in hooks_data:
                    if h.get("clip_reference") == c["title"]:
                        hook = Hook(clip_id=clip.id, text=h["text"])
                        db.add(hook)
                        
                for cap in captions_data:
                    if cap.get("clip_reference") == c["title"]:
                        caption = Caption(
                            clip_id=clip.id,
                            start_time=cap["start_time"],
                            end_time=cap["end_time"],
                            text=cap["text"]
                        )
                        db.add(caption)
            
            job.status = "COMPLETED"
            job.progress = 100.0
            job.result_json = json.dumps(response)
            db.commit()
            
        except Exception as e:
            db.rollback()
            # Fetch job again as the previous one might be rolled back if modified
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.status = "FAILED"
                job.error_message = "Processing failed during transcript extraction"
                db.commit()
