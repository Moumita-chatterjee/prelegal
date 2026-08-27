# Prelegal

A web app for drafting common legal agreements through an AI chat. Tell the assistant what
document you need, answer its questions, and watch the agreement fill in live — then sign and
download it as a PDF.

**Status:** V1 feature-complete — all 11 supported document types, user accounts, and per-user
document persistence are in place.

## Features

- AI chat that figures out which of 11 supported document types (NDA, CSA, PSA, DPA, SLA,
  Software License, Partnership Agreement, BAA, Pilot Agreement, AI Addendum, Design Partner
  Agreement) fits your request, or suggests the closest match if it can't help
- Conversational field-gathering with a live document preview as you chat
- Per-party e-signatures and PDF download
- User accounts (sign up / sign in) with documents saved to your account so you can resume or
  delete them later from "My documents"

## Tech stack

- **Backend:** FastAPI (Python, managed with `uv`), SQLite, JWT auth
- **Frontend:** Next.js, statically exported and served by the backend
- **LLM:** OpenRouter, routed to Cerebras for inference, with structured outputs
- **Packaging:** a single Docker image containing both the API and the static frontend

## Running it

Build and start the container, then open `http://localhost:8000`:

```bash
# Mac
scripts/start-mac.sh
scripts/stop-mac.sh

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

An `OPENROUTER_API_KEY` must be set in a `.env` file in the project root before starting. The
database is recreated from scratch on every start, so accounts and documents don't persist across
restarts.

## Templates

Legal agreement templates in `templates/` are from Common Paper and used under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — see `templates/LICENSE.txt`.
