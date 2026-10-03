# CreatorAi Backend

This is the fully integrated and stabilized CreatorAi Backend, built with FastAPI, SQLAlchemy, and SQLite.

## Architecture

The backend follows a standard layered architecture:
- **Routes (`app/routes/`)**: Exposes REST API endpoints and validates input.
- **Services (`app/services/`)**: Orchestrates business logic (e.g., job processing, file handling, export).
- **Models (`app/models/`)**: Defines the relational SQLite database schemas using SQLAlchemy.
- **AI Engine Abstraction (`app/services/ai_engine/`)**: Handles transcript generation, clip selection, hook, and caption creation via a Mock AI pipeline for Person 4 to integrate into.
- **Renderer Abstraction (`app/services/renderer.py`)**: Defines rendering capabilities and handles mock media export outputs.

## Setup

1. **Python Setup**: Ensure Python 3.11+ is installed.
2. **Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   ```
3. **Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Environment Variables

Copy `.env.example` to `.env`. Example setup:
```ini
APP_NAME="CreatorAi Backend"
DEBUG=True
DATABASE_URL="sqlite:///./creator_ai.db"
# Placeholders for future AI integrations:
# OPENAI_API_KEY=your_key
# DEEPGRAM_API_KEY=your_key
```

## API Endpoints

A fully documented Swagger UI is available at `http://localhost:8000/docs`.

### Projects
- `GET /api/projects`: List projects
- `POST /api/projects`: Create a new project
- `GET /api/projects/{id}`: Get project details
- `POST /api/projects/{id}/process`: Start clip generation processing

### Assets & Scripts
- `POST /api/projects/{id}/assets`: Upload video file (FormData)
- `POST /api/projects/{id}/scripts`: Upload script content

### Clips & Exports
- `GET /api/projects/{id}/clips`: Retrieve generated clips
- `POST /api/clips/{clip_id}/export`: Initiate rendering/export for a clip
- `GET /api/exports/{export_id}`: Poll for export job status

## AIEngine Contract

The `BaseAIEngine` abstract base class mandates one primary function:
```python
async def process_content(self, request: dict) -> dict:
```
**Request format:**
```json
{
  "job_id": "string",
  "project_id": "string",
  "video_path": "string",
  "script_text": "string",
  "options": {}
}
```
**Response format:**
```json
{
  "status": "completed",
  "transcript": {"segments": [{"start": 0.0, "end": 5.0, "text": "..."}]},
  "clips": [{"start_time": 0.0, "end_time": 5.0, "title": "Clip", "score": 90, "reason": "Engaging"}],
  "hooks": [{"clip_reference": "Clip", "text": "Hook text"}],
  "captions": [{"clip_reference": "Clip", "start_time": 0.0, "end_time": 5.0, "text": "..."}]
}
```

## Renderer Contract

The `BaseRenderer` abstract base class mandates one primary function:
```python
async def render(self, request: RenderRequest, clip_id: int) -> dict:
```
**Response format:**
```json
{
  "status": "completed",
  "output_path": "exports/render_1.mp4"
}
```

## Example Workflow

1. Create a Project using `POST /api/projects`.
2. Upload a video Asset with `POST /api/projects/{id}/assets`.
3. Upload a Script with `POST /api/projects/{id}/scripts`.
4. Trigger AI Processing via `POST /api/projects/{id}/process`. The job will asynchronously mock the generation of Clips, Transcripts, and Captions.
5. Retrieve Clips using `GET /api/projects/{id}/clips`.
6. Enqueue an export rendering for a Clip to a specific PlatformVariant using `POST /api/clips/{id}/export`.
7. Download the final result from the `output_path`!

## Testing

Run tests using pytest from the `backend/person 3/` directory:
```bash
python -m pytest tests/ -v
```

## Frontend Integration

The backend is configured to accept CORS from standard React/Next.js/Vite ports (`localhost:3000`, `localhost:5173`, etc.).
Ensure your Frontend connects using the base URL: `http://localhost:8000/api`.
Use Axios or Fetch to poll `GET /api/jobs/{id}` and `GET /api/exports/{id}` to update UI progress bars asynchronously.
