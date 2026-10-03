import os
import sys

# Ensure backend directory is in path so we can import person4
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

try:
    from person4.ai.pipeline import CreatorAIPipeline
except ImportError:
    # If the exact path differs, handle it gracefully
    CreatorAIPipeline = None

from app.services.ai_engine.base import BaseAIEngine

class RealAIEngine(BaseAIEngine):
    async def process_content(self, request: dict) -> dict:
        if not CreatorAIPipeline:
            raise RuntimeError("Person 4's CreatorAIPipeline could not be imported.")
            
        pipeline = CreatorAIPipeline()
        video_path = request.get("video_path")
        if not video_path:
            raise ValueError("video_path is required for RealAIEngine")
            
        # Ensure path is absolute if it's relative to person 3 backend
        # assuming person 3 is our cwd
        if not os.path.isabs(video_path):
            video_path = os.path.abspath(video_path)
            
        result = pipeline.process_video(video_path, max_moments=3) # Limit for speed
        
        # result has {"status": "completed", "transcript": [...], "clips": [...]}
        # We need to map it to the contract
        
        transcript_segments = result.get("transcript", [])
        
        contract_clips = []
        contract_hooks = []
        contract_captions = []
        
        for c in result.get("clips", []):
            clip_title = f"Clip_{c.get('start', 0)}"
            contract_clips.append({
                "start_time": c.get("start", 0.0),
                "end_time": c.get("end", 0.0),
                "title": clip_title,
                "score": c.get("viral_score", 85.0),
                "reason": c.get("hook_analysis", "Good moment")
            })
            
            # Hooks
            for hook in c.get("hooks", []):
                contract_hooks.append({
                    "clip_reference": clip_title,
                    "text": hook.get("hook", hook.get("text", str(hook)))
                })
                
            # Captions
            # For captions we can just take the caption string or structured data
            # Assuming caption is a string or dict
            cap_data = c.get("caption", {})
            cap_text = cap_data.get("caption", str(cap_data)) if isinstance(cap_data, dict) else str(cap_data)
            contract_captions.append({
                "clip_reference": clip_title,
                "start_time": c.get("start", 0.0),
                "end_time": c.get("end", 0.0),
                "text": cap_text
            })
            
        return {
            "status": "completed",
            "transcript": {"segments": transcript_segments},
            "clips": contract_clips,
            "hooks": contract_hooks,
            "captions": contract_captions
        }
