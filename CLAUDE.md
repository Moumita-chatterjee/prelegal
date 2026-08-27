# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports all 11 document types via AI chat with full user authentication. Chat history and drafted fields are in-memory only (no document persistence yet).

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
- **Frontend**: added minimal `/signup` and `/login` pages (shared `AuthForm` component) and a top nav bar reflecting signed-in state, using the color scheme above. Switched to `output: "export"` + `trailingSlash: true` in `next.config.ts` so the frontend can be statically built and served by FastAPI.
- **Docker**: single multi-stage `Dockerfile` (builds the Next.js static export, then copies it into the FastAPI image, which serves both the API and the static frontend on port 8000).
- **Scripts**: `scripts/start-{mac,linux}.sh` / `stop-{mac,linux}.sh` and `scripts/start-windows.ps1` / `stop-windows.ps1` build/run/stop the single container.

Key decisions: minimal auth UI is in scope for this ticket (not just backend endpoints), JWT bearer tokens (not session cookies) are used, and everything ships as one Docker container rather than docker-compose. The NDA generator page (`frontend/app/page.tsx`) is wrapped in a `RequireAuth` component and redirects to `/login` for signed-out visitors — after user testing, the NDA document is meant to open only after sign-in rather than being publicly accessible.

### PREL-5: Add AI Chat but still just Mutual NDA

Replaced the manual NDA form with a freeform AI chat that gathers the same fields conversationally — still only the Mutual NDA, no new document types:

- **Backend**: `backend/app/llm.py` calls `openrouter/openai/gpt-oss-120b` via LiteLLM, routed through OpenRouter to the Cerebras inference provider (`extra_body={"provider": {"order": ["cerebras"], "allow_fallbacks": false, "require_parameters": true}}`, no silent fallback to another provider), using strict JSON-schema structured outputs so each turn returns both a conversational `reply` and the model's complete current understanding of every NDA field (`fields`) based on the whole conversation so far, not just what changed that turn. New endpoint `POST /api/nda/chat` (`backend/app/routers/nda.py`) is gated behind the existing auth dependency — required since it's a billed third-party call. Covered by pytest with the LLM call mocked (no real network calls in the test suite); also validated with live calls against the real API during development.
- **Frontend**: `NdaForm.tsx`/`PartyFields.tsx` deleted; replaced by `NdaChat.tsx` (the chat UI) and `SignatureStep.tsx` (a dedicated per-party signature step, since drawing a signature can't happen through text chat — reuses the existing `SignaturePad`). `lib/nda/chat.ts` merges each turn's field updates into the existing form state (only non-null values overwrite, since the model resends its full belief state each turn). Signing a party's signature pad auto-stamps that party's date (the chat never asks about it, since "whenever they actually sign" is the natural answer). Factored a shared `apiClient.ts` out of the auth API client so the new chat client doesn't duplicate its fetch/error-handling logic.
- Chat history and extracted fields are in-memory only (React state, lost on refresh) — no new backend persistence, matching PREL-4's "no document persistence yet" scope.

Key decisions (confirmed with the user before implementation): chat fully replaces the form rather than sitting alongside it; signatures get a small dedicated UI step rather than being dropped or chat-driven; no backend persistence of conversations yet; replies arrive as a complete message per turn rather than streaming.

### PREL-6: Expand to all supported legal document types

Generalized the Mutual-NDA-only chat/render pipeline into a schema-driven engine covering all 11 catalog documents, with graceful handling when the user asks for something unsupported:

- **Field schema (`backend/app/documents/fields.py`, `registry.py`)**: a single recursive `FieldDef` shape (flat scalar / enum / group) models every document's fields — a non-repeating group is a party or nested object, a repeating group is PSA's Statements of Work or DPA's Approved Subprocessors list. One `DocumentType` config per catalog entry (11 total; the NDA's two catalog entries — Standard Terms and Cover Page — both map to `mutual_nda`) drives the LLM prompt, the strict JSON schema, and a dynamically-built Pydantic validation model, so those three can't drift out of sync the way a hand-maintained pair could.
- **LLM call (`backend/app/documents/llm.py`)**: NDA's Cerebras/reasoning-leak hardening from PREL-5 (provider pinning, `reasoning.exclude`, retry-on-leak, `\n`/`\t`/`\r` unescaping) is preserved verbatim as a shared core, now parameterized by document type instead of hardcoded to the NDA. A separate classification call resolves which of the 11 documents the user wants from a single message (or explains it can't help and suggests the closest match, per the ticket) — on the first turn where it resolves, the same message history is immediately chained into that document's field-gathering call so the user's initial answer isn't lost.
- **Rendering (`frontend/lib/documents/render.ts`)**: discovered mid-implementation that only the NDA has an actual fillable cover-page template — the other 10 documents are pure boilerplate referencing variables inline via `<span class="*_link">Name</span>` markers, with no signature block at all. The renderer resolves each field's value and substitutes it directly into the boilerplate prose (falling back to a bracketed placeholder if the field is known but still empty, or to the literal span text if unmapped, e.g. cross-references to a companion "DPA"/"Agreement" this app doesn't generate); a synthesized "Key Terms" summary and signature block (using each document's real party-pair labels, e.g. Provider/Customer, Company/Partner) are appended generically. PSA's SOWs and DPA's subprocessors, which can't be inlined at a single point once there's more than one, render as an appended exhibit/annex section instead. `frontend/scripts/generate-templates.mjs` (a `predev`/`prebuild` step) embeds `templates/*.md` verbatim into a generated module, replacing PREL-5's hand-ported `standardTerms.ts` for all 11 documents — the `Dockerfile`'s frontend build stage now also copies `templates/` in for this.
- **NDA folded into the same generic pipeline** (`document_type="mutual_nda"`) rather than kept as a frozen parallel path — `Mutual-NDA.md`'s Standard Terms already use the same `coverpage_link` span convention as the other 10 documents, so no separate renderer was needed; the old `NdaChat`/`NdaPreview`/`NdaPdfDocument`/`lib/nda/*` are deleted in favor of their `components/documents/`/`lib/documents/` generic equivalents. `frontend/app/page.tsx` is now a small two-phase state machine (routing until a document type resolves, then gathering) instead of assuming NDA.
- Frontend field metadata (`frontend/lib/documents/registry.ts`) is a small hand-authored mirror of the backend's field list (labels, span variable names, party/repeat/appendix flags only — not prompt or JSON-schema logic) — accepted as a low-churn duplication in exchange for not needing a cross-language build step between the Python backend and the statically-exported frontend.

Key decisions (confirmed with the user before implementation): a generic schema-driven engine and generic markdown-fill renderer over hand-copying the NDA pattern 11 times; full fidelity for PSA's multi-SOW and DPA's structured/GDPR-annex data rather than simplifying them for v1. Validated end-to-end in the browser (not just mocked tests) for NDA regression, a new flat document, PSA's multi-SOW rendering, and the unsupported-document conversational flow, which caught and fixed three real template-parsing bugs (bare `<span id="...">` anchors, a variable span nested inside `**bold**` markdown, and a dropped possessive suffix on unfilled placeholders) that the mocked backend tests alone couldn't have surfaced.

