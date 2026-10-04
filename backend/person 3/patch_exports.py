import os

file_path = "app/routes/exports.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "from pydantic import BaseModel\nimport asyncio",
    "from pydantic import BaseModel\nfrom typing import Optional\nimport asyncio"
)

content = content.replace(
    "class ExportRequest(BaseModel):\n    platform_variant_id: int",
    "class ExportRequest(BaseModel):\n    platform_variant_id: int\n    prompt: Optional[str] = None"
)

target_render_req = """    # Build RenderRequest
    render_req = RenderRequest(
        source_video=source_path,
        start_time=clip.start_time or 0.0,
        end_time=clip.end_time or 0.0,
        aspect_ratio=platform_variant.aspect_ratio or "9:16",
        width=platform_variant.width or 1080,
        height=platform_variant.height or 1920,
        captions=[{"text": c.text, "start_time": c.start_time, "end_time": c.end_time} for c in captions],
        edit_operations=[{"type": e.edit_type, "data": e.edit_data} for e in edits]
    )"""

new_render_req = """    # Build RenderRequest
    render_req = RenderRequest(
        source_video=source_path,
        start_time=clip.start_time or 0.0,
        end_time=clip.end_time or 0.0,
        aspect_ratio=platform_variant.aspect_ratio or "9:16",
        width=platform_variant.width or 1080,
        height=platform_variant.height or 1920,
        captions=[{"text": c.text, "start_time": c.start_time, "end_time": c.end_time} for c in captions],
        edit_operations=[{"type": e.edit_type, "data": e.edit_data} for e in edits]
    )

    if request.prompt:
        from app.services.planner import generate_edit_plan
        plan = generate_edit_plan(request.prompt)
        
        if plan.output:
            if plan.output.aspect_ratio:
                render_req.aspect_ratio = plan.output.aspect_ratio
            if plan.output.width:
                render_req.width = plan.output.width
            if plan.output.height:
                render_req.height = plan.output.height
                
        for op in plan.operations:
            op_dict = op.model_dump(exclude_none=True)
            op_type = op_dict.pop("type")
            render_req.edit_operations.append({
                "type": op_type,
                "data": op_dict
            })
            if op_type == "trim":
                if "start" in op_dict:
                    render_req.start_time = float(op_dict["start"])
                if "end" in op_dict:
                    render_req.end_time = float(op_dict["end"])"""

content = content.replace(target_render_req, new_render_req)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
