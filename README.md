# Async Document Processing Workflow System

A full-stack async document processing application where users can upload documents, trigger background processing, track progress live, review/edit extracted output, finalize results, retry failed jobs, and export finalized data as JSON or CSV.

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Celery
- Redis

---

## Features

- Upload document from frontend
- Save uploaded file to local storage
- Save metadata and processing state in PostgreSQL
- Trigger background processing using Celery
- Use Redis as Celery broker
- Publish progress events using Redis Pub/Sub
- Stream progress updates to frontend using Server-Sent Events (SSE)
- Dashboard with:
  - search
  - filter by status
  - sorting
- Document detail page
- Live progress bar while processing
- Review and edit extracted data
- Finalize reviewed result
- Retry failed jobs
- Export finalized document as JSON
- Export finalized document as CSV

---

## Architecture Overview

### High-level flow

1. User uploads a document from the React frontend.
2. FastAPI receives the file and:
   - saves file to local `uploads/`
   - stores document metadata in PostgreSQL
   - queues a Celery background job
3. Celery worker picks the job from Redis.
4. Worker simulates document parsing and extraction.
5. Worker publishes progress events using Redis Pub/Sub.
6. FastAPI exposes progress updates through an SSE endpoint.
7. Frontend listens to SSE and shows live processing progress.
8. User reviews extracted output, edits it, finalizes it, and exports it.

---

## Project Structure

```text
project-root/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── workers/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── uploads/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── sample-files/
├── sample-outputs/
├── docker-compose.yml
└── README.md
Setup Instructions
Prerequisites
Make sure the following are installed:

Node.js (18+ recommended)
Python (3.11 recommended)
Docker Desktop
Git
Backend Setup
1. Go to backend folder
Bash

cd backend
2. Create virtual environment
Windows PowerShell
Bash

python -m venv venv
.\venv\Scripts\Activate.ps1
3. Install dependencies
Bash

pip install -r requirements.txt
4. Create .env file
Example:

env

DATABASE_URL=postgresql://postgres:1234@localhost:5432/mydb
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
UPLOAD_DIR=uploads

Frontend Setup
1. Go to frontend folder
Bash
cd frontend

2. Install dependencies
Bash

npm install
3. Run frontend
Bash
npm run dev

Frontend runs on:
text

http://localhost:5173
Docker Setup
Start PostgreSQL and Redis.

If using docker-compose.yml:

Bash

docker compose up -d
If Redis is not included in compose, start manually:

Bash

docker run -d --name redis -p 6379:6379 redis:7-alpine
Run the App
You need multiple terminals.

Terminal 1 — Backend API
Bash
cd backend
.\venv\Scripts\Activate.ps1

python -m uvicorn app.main:app --reload --port 8001
Backend runs on:
text
http://localhost:8001
Swagger docs:
text
http://localhost:8001/docs

Terminal 2 — Celery Worker
Bash

cd backend
.\venv\Scripts\Activate.ps1
$env:PYTHONPATH="C:\full\path\to\your\backend"
python -m celery -A app.workers.celery_app:celery worker --loglevel=info --pool=solo
Note: --pool=solo is used because Celery on Windows works more reliably with the solo pool.

Terminal 3 — Frontend
Bash
cd frontend
npm run dev

Open:


Sample Testing Flow
Successful processing flow
Upload a normal file
Watch live progress on detail page
Wait until status becomes completed
Edit extracted fields
Save changes
Finalize document
Export JSON / CSV

if file is not right i if get failed it will show retry option to start again the process

Assumptions
File processing logic is simulated.
OCR / AI quality is not the focus.
Local file storage is used instead of cloud storage.
Authentication is not implemented because it was optional / bonus.
Search, filter, and sorting are handled on the frontend for simplicity.

Tradeoffs
Used SSE instead of WebSockets because progress updates are one-way from server to client.
Used local file system storage for simplicity and faster development.
Used frontend-side search/filter/sorting instead of backend query params to reduce implementation complexity.
Retry failure is demonstrated using a simulated failure rule based on filename.

Limitations
No authentication / user management
Local file storage only
No deployment configuration
No automated tests currently
Processing logic is mocked/simulated
Retry demo depends on simulated failure logic

AI Tools Usage
AI assistance was used during development for:
concept explanation
debugging support
architecture guidance
code structuring help
All code was manually reviewed, integrated, adjusted, and tested during development.
