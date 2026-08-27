# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports all 11 document types via AI chat with full user authentication and document persistence.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Completed Work

### PREL-4: Build foundation of V1 product

Added the technical foundation described above without changing the existing Mutual NDA product feature:

- **Backend** (`backend/`): uv-managed FastAPI project with a SQLite `users` table (SQLAlchemy), `/api/auth/signup`, `/api/auth/signin`, `/api/auth/me` (JWT bearer auth, bcrypt password hashing), and `/api/health`. The database is dropped and recreated on every app startup, so it is always empty when the container (re)starts. The JWT signing secret defaults to a fresh random value generated per process (no hardcoded fallback) since tokens never need to outlive one run of the ephemeral database — set `JWT_SECRET` explicitly only if tokens must survive a restart. Covered by pytest (`backend/tests/`).
- **Frontend**: added minimal `/signup` and `/login` pages (shared `AuthForm` component) and a top nav bar reflecting signed-in state, using the color scheme above. The existing NDA generator page is untouched and stays open/ungated — auth is scaffolded but not yet enforced anywhere. Switched to `output: "export"` + `trailingSlash: true` in `next.config.ts` so the frontend can be statically built and served by FastAPI.
- **Docker**: single multi-stage `Dockerfile` (builds the Next.js static export, then copies it into the FastAPI image, which serves both the API and the static frontend on port 8000).
- **Scripts**: `scripts/start-{mac,linux}.sh` / `stop-{mac,linux}.sh` and `scripts/start-windows.ps1` / `stop-windows.ps1` build/run/stop the single container.

Key decisions (confirmed with the user before implementation): minimal auth UI is in scope for this ticket (not just backend endpoints), the NDA tool stays ungated, JWT bearer tokens (not session cookies) are used, and everything ships as one Docker container rather than docker-compose.

