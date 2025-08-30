# Cloud-Native Video App (FastAPI + React)

A full-stack video platform with auth (JWT), video upload & viewing, comments, ratings, and admin dashboards.  
**Stack:** FastAPI, SQLAlchemy, React (Vite + TS), React Query, Tailwind, shadcn/ui.

## Quick start
- Backend: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm i && npm run dev` (set `VITE_API_URL` in `frontend/.env`)

## Features
- Auth (JWT), role-based access (consumer/creator/admin)
- Upload videos (progress), watch videos
- Comments (add/edit/delete)
- Ratings (1–5) with averages
- Admin dashboards (users, videos, reports)

## Screenshots
> Add images under `docs/screenshots/` and reference them here.
