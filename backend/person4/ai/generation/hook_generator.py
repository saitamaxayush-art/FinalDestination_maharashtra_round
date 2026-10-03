from google import genai
from google.genai import types
from pydantic import BaseModel, Field


class HookResult(BaseModel):
    hooks: list[str] = Field(description="Three distinct short-form video hooks")


def generate_hooks(moment):
    client = genai.Client()

    prompt = f"""
Create exactly 3 different hooks for a short-form social media video.

VIDEO CONTENT:
{moment["text"]}

CONTENT TYPE:
{moment.get("content_type", "general")}

RULES:
- Each hook must be different.
- Keep each hook short and attention-grabbing.
- Do not invent facts.
- Do not change the meaning of the video.
- Make the hooks sound natural when spoken aloud.
- Avoid generic phrases like "Here's what most creators miss".
- Use different approaches:
  1. Curiosity
  2. Question or relatable problem
  3. Strong statement
- Return only the 3 hooks.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=HookResult,
        ),
    )

    result = response.parsed

    if result is None:
        result = HookResult.model_validate_json(response.text)

    return result.hooks[:3]
