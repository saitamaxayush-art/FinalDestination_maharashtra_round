from google import genai
from google.genai import types
from pydantic import BaseModel, Field


class CaptionResult(BaseModel):
    caption: str = Field(description="A short social media caption")


def generate_caption(moment):
    client = genai.Client()

    prompt = f"""
Write one engaging social media caption for this short-form video.

VIDEO:
{moment["text"]}

CONTENT TYPE:
{moment.get("content_type", "general")}

RULES:
- Keep it concise.
- Make it natural and conversational.
- Summarize the actual video.
- Do not invent facts.
- Do not simply repeat the transcript.
- End with a natural engagement question when appropriate.
- Do not use more than 3 hashtags.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CaptionResult,
        ),
    )

    result = response.parsed

    if result is None:
        result = CaptionResult.model_validate_json(response.text)

    return result.caption
