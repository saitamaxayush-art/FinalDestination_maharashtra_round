import os
import asyncio
import json
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys

# Setup paths
sys.path.insert(0, os.path.abspath('app'))

from app.database import Base, get_db
from app.models.domain import Project, Asset, Clip, PlatformVariant
from app.services.renderer import FFmpegRenderer, RenderRequest
from app.main import app
import time

async def run_tests():
    print("--- 3. GENERATE ONE REAL VIDEO ---")
    renderer = FFmpegRenderer()
    
    reference_video = os.path.abspath(os.path.join("..", "..", "frontend", "reference", "story.mp4"))
    
    req = RenderRequest(
        source_video=reference_video,
        start_time=0.0,
        end_time=2.0,
        aspect_ratio="9:16",
        width=1080,
        height=1920,
        captions=[],
        edit_operations=[]
    )
    
    try:
        res = await renderer.render(req, 99999)
        output_path = res["output_path"]
        
        # Rename it to test_layer1.mp4
        output_dir = os.path.dirname(output_path)
        test_layer1_path = os.path.join(output_dir, "test_layer1.mp4")
        if os.path.exists(test_layer1_path):
            os.remove(test_layer1_path)
        os.rename(output_path, test_layer1_path)
        
        size = os.path.getsize(test_layer1_path)
        print(f"Generated test_layer1.mp4 size: {size} bytes")
        if size == 0:
            print("FAIL: test_layer1.mp4 is 0 bytes")
        else:
            print("PASS: Real FFmpeg rendering generated a valid file.")
    except Exception as e:
        print(f"FAIL: Renderer threw exception: {e}")

    # Use TestClient with default database
    from app.database import init_db, SessionLocal
    init_db()
    db = SessionLocal()
    
    client = TestClient(app)

    print("\n--- 4. TEST HTTP SERVING ---")
    try:
        resp = client.get("/exports/test_layer1.mp4")
        print(f"HTTP Status: {resp.status_code}")
        print(f"Content-Type: {resp.headers.get('content-type')}")
        print(f"Response size: {len(resp.content)} bytes")
        if resp.status_code == 200 and len(resp.content) > 0:
            print("PASS: Direct MP4 serving.")
        else:
            print("FAIL: Direct MP4 serving.")
    except Exception as e:
        print(f"FAIL: Direct MP4 serving threw exception: {e}")

    print("\n--- 5. TEST REAL EXPORT ENDPOINT ---")
    
    project = Project(name="Test Project")
    db.add(project)
    db.commit()
    db.refresh(project)
    
    asset = Asset(project_id=project.id, name="Test Asset", asset_type="video", file_path=reference_video)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    
    clip = Clip(project_id=project.id, source_asset_id=asset.id, start_time=0.0, end_time=2.0)
    db.add(clip)
    db.commit()
    db.refresh(clip)
    
    variant = PlatformVariant(clip_id=clip.id, platform="tiktok", aspect_ratio="9:16", width=720, height=1280)
    db.add(variant)
    db.commit()
    db.refresh(variant)

    try:
        post_resp = client.post(f"/api/clips/{clip.id}/export", json={"platform_variant_id": variant.id})
        post_res = post_resp.json()
        export_id = post_res["export_id"]
        print(f"Triggered export API, export_id: {export_id}")
        
        # TestClient runs BackgroundTasks synchronously, so it should be immediately completed!
        get_resp = client.get(f"/api/exports/{export_id}")
        get_res = get_resp.json()
        print(f"Status: {get_res['status']}, Progress: {get_res['progress']}")
        if get_res["status"] == "completed":
            print(f"PASS: Real export endpoint finished. Output URL: {get_res.get('output_url')}")
        elif get_res["status"] == "failed":
            print(f"FAIL: Export failed: {get_res.get('error_message')}")
        else:
            print("FAIL: Export API didn't complete synchronously as expected.")
    except Exception as e:
        print(f"FAIL: Export API threw exception: {e}")

    print("\n--- 7. VERIFY MISSING SOURCE BEHAVIOR ---")
    asset2 = Asset(project_id=project.id, name="Missing Asset", asset_type="video", file_path="/fake/path/that/doesnt/exist.mp4")
    db.add(asset2)
    db.commit()
    db.refresh(asset2)
    
    clip2 = Clip(project_id=project.id, source_asset_id=asset2.id, start_time=0.0, end_time=1.0)
    db.add(clip2)
    db.commit()
    db.refresh(clip2)
    
    variant2 = PlatformVariant(clip_id=clip2.id, platform="tiktok", aspect_ratio="9:16", width=720, height=1280)
    db.add(variant2)
    db.commit()
    db.refresh(variant2)
    
    try:
        post_resp = client.post(f"/api/clips/{clip2.id}/export", json={"platform_variant_id": variant2.id})
        post_res = post_resp.json()
        export_id2 = post_res["export_id"]
        
        get_resp = client.get(f"/api/exports/{export_id2}")
        get_res = get_resp.json()
        if get_res["status"] == "failed":
            print(f"PASS: Missing source correctly failed with: {get_res.get('error_message')}")
        else:
            print(f"FAIL: Missing source didn't reach 'failed' status. Got: {get_res['status']}")
    except Exception as e:
        print(f"FAIL: Missing source check threw exception: {e}")

    db.close()

if __name__ == "__main__":
    asyncio.run(run_tests())
