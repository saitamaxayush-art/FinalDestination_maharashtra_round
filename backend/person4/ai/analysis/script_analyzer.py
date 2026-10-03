def analyze_script(script: str) -> dict:
    """Return a simple structured script analysis.

    Replace/extend this with the selected LLM once the team finalizes its
    generation provider and prompt contracts.
    """
    text = script.strip()
    sentences = [s.strip() for s in text.replace("!", ".").replace("?", ".").split(".") if s.strip()]

    return {
        "word_count": len(text.split()),
        "sentence_count": len(sentences),
        "has_hook": bool(sentences),
        "opening": sentences[0] if sentences else "",
        "script": text,
    }
