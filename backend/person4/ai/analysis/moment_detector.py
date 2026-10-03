from google import genai
from google.genai import types
from pydantic import BaseModel, Field


class SelectedMoment(BaseModel):
    candidate_id: int = Field(description="ID of the candidate moment")
    score: float = Field(description="Value of this moment from 0 to 10")
    reason: str = Field(description="Why this moment is valuable")
    content_type: str = Field(
        description="Type such as hook, insight, story, opinion, tip, or emotional"
    )


class MomentSelection(BaseModel):
    moments: list[SelectedMoment]


def build_candidates(transcript, window_seconds=12):
    candidates = []

    for i, segment in enumerate(transcript):
        start = float(segment["start"])
        end = float(segment["end"])

        text_parts = [segment["text"]]

        for next_segment in transcript[i + 1:]:
            next_start = float(next_segment["start"])

            if next_start - start > window_seconds:
                break

            text_parts.append(next_segment["text"])
            end = float(next_segment["end"])

        if end - start < 5:
            continue

        if end - start > 20:
            end = start + 20

        candidates.append({
            "candidate_id": len(candidates) + 1,
            "start": start,
            "end": end,
            "text": " ".join(text_parts).strip(),
        })

    # Remove near-duplicate overlapping candidates
    filtered = []

    for candidate in candidates:
        if not filtered:
            filtered.append(candidate)
            continue

        previous = filtered[-1]

        if candidate["start"] < previous["end"] - 3:
            continue

        filtered.append(candidate)

    return filtered[:50]


def detect_moments(transcript_data, max_moments=5):
    transcript = transcript_data["segments"]

    candidates = build_candidates(transcript)

    if not candidates:
        return []

    candidate_text = "\n\n".join(
        f"""
CANDIDATE {c["candidate_id"]}
START: {c["start"]}
END: {c["end"]}
TEXT: {c["text"]}
""".strip()
        for c in candidates
    )

    prompt = f"""
You are selecting short-form video moments for CreatorAI.

Choose up to {max_moments} of the strongest candidates.

A strong moment should:
- make sense by itself
- contain a hook, insight, story, opinion, tip, or emotional statement
- be useful or interesting to a viewer
- work as a short-form social media clip
- avoid unnecessary context

IMPORTANT:
- Only select existing candidate IDs.
- Do not invent timestamps.
- Do not invent text.
- Prefer different moments rather than duplicates.
- Score each selected moment from 0 to 10.

CANDIDATES:

{candidate_text}
"""

    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=MomentSelection,
        ),
    )

    result = response.parsed

    if result is None:
        result = MomentSelection.model_validate_json(response.text)

    candidate_map = {
        c["candidate_id"]: c
        for c in candidates
    }

    moments = []

    for selected in result.moments:
        candidate = candidate_map.get(selected.candidate_id)

        if candidate is None:
            continue

        moments.append({
            "start": candidate["start"],
            "end": candidate["end"],
            "text": candidate["text"],
            "score": selected.score,
            "reason": selected.reason,
            "content_type": selected.content_type,
        })

    moments.sort(key=lambda x: x["score"], reverse=True)

    return moments[:max_moments]
