from google import genai
from google.genai import types
from pydantic import BaseModel, Field


class MetadataResult(BaseModel):
    title: str = Field(description="A short, compelling video title")
    description: str = Field(description="A concise social media description")
    hashtags: list[str] = Field(description="Three to five relevant hashtags")


def generate_metadata(moment):
    client = genai.Client()

    prompt = f"""
Generate social media metadata for this short-form video.

VIDEO:
{moment["text"]}

CONTENT TYPE:
{moment.get("content_type", "general")}

RULES:
- Title should be short, clear, and attention-grabbing.
- Description should summarize the actual video naturally.
- Do not invent facts or claims.
- Hashtags must be directly relevant to the video.
- Generate 3 to 5 hashtags.
- Hashtags must start with #.
- Avoid generic spam hashtags such as #viral or #fyp.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=MetadataResult,
        ),
    )

    result = response.parsed

    if result is None:
        result = MetadataResult.model_validate_json(response.text)

    return {
        "title": result.title,
        "description": result.description,
        "hashtags": result.hashtags[:5],
    }
