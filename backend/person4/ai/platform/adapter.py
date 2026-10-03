from google import genai
from google.genai import types
from pydantic import BaseModel, Field


class PlatformMetadata(BaseModel):
    title: str = Field(description="Platform-specific title")
    caption: str = Field(description="Platform-specific caption")
    hashtags: list[str] = Field(description="Relevant hashtags")


class PlatformAdapterResult(BaseModel):
    tiktok: PlatformMetadata
    instagram_reels: PlatformMetadata
    youtube_shorts: PlatformMetadata


def adapt_for_platforms(moment):
    client = genai.Client()

    prompt = f"""
Adapt this short-form video for TikTok, Instagram Reels, and YouTube Shorts.

VIDEO:
{moment["text"]}

CONTENT TYPE:
{moment.get("content_type", "general")}

Create platform-specific metadata.

TIKTOK:
- Casual and conversational.
- Strong opening.
- Short caption.
- 3 to 5 relevant hashtags.
- Do not use generic spam hashtags.

INSTAGRAM REELS:
- Natural and engaging.
- Slightly more polished than TikTok.
- Short caption.
- 3 to 5 relevant hashtags.
- Encourage conversation when appropriate.

YOUTUBE SHORTS:
- Clear, searchable title.
- Concise description.
- 3 to 5 relevant hashtags.
- Focus on the actual topic.

GENERAL RULES:
- Do not invent facts.
- Do not change the meaning of the video.
- Do not make claims that are not supported by the video.
- Each platform should have meaningfully different wording.
- Hashtags must start with #.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PlatformAdapterResult,
        ),
    )

    result = response.parsed

    if result is None:
        result = PlatformAdapterResult.model_validate_json(response.text)

    return {
        "tiktok": result.tiktok.model_dump(),
        "instagram_reels": result.instagram_reels.model_dump(),
        "youtube_shorts": result.youtube_shorts.model_dump(),
    }
