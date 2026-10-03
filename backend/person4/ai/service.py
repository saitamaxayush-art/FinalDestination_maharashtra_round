from ai.pipeline import CreatorAIPipeline


_pipeline = CreatorAIPipeline()


def process_video(
    video_path: str,
    output_dir: str = "outputs",
    max_moments: int = 10,
) -> dict:
    """
    Main entry point for the CreatorAI AI pipeline.

    Person 3's backend should call this function rather than
    importing individual AI modules.
    """

    return _pipeline.process_video(
        video_path=video_path,
        output_dir=output_dir,
        max_moments=max_moments,
    )
