# Demo Walkthrough

A script for showing **AI Courtroom** to a recruiter, interviewer, or prospective client in ~5 minutes. Two ways to run it — pick whichever fits the moment:

- **Local-first (recommended, no cold-start risk)**: a self-contained `docker compose up` — no external accounts, no waiting on a free-tier host to wake up. See below.
- **Hosted demo**: the Render/Vercel deployment. Its accounts are provisioned automatically, but the free-tier services must be awake first (see [Hosted demo](#hosted-demo-fallback) below).

---

## Local-first demo (recommended)

**Requirements:** Docker + Docker Compose. Nothing else — the AI microservice defaults to the hosted URL, so AI features work out of the box too as long as that happens to be awake; if not, everything else in the demo (auth, dashboards, case management, chat) works with zero external dependencies.

```bash
git clone https://github.com/dhruv-15-03/AI-CourtRoom.git
cd AI-CourtRoom
cp .env.example .env                # defaults work as-is, no editing required
docker compose up --build           # first run: ~2-3 min (Maven + npm build)
```

Wait until `docker compose ps` shows `backend` and `frontend` as `healthy`, then seed the 3 demo accounts (one-time, real signup+login API calls under the hood — see `docker/seed-demo-users.sh`):

```bash
docker compose run --rm seed
```

Open <http://localhost:3000> and log in with any of:

| Role | Email | Password |
|------|-------|----------|
| User | `user@example.com` | `password123` |
| Lawyer | `lawyer@example.com` | `password123` |
| Judge | `judge@example.com` | `password123` |

**What this actually verifies, end to end** (re-run and confirmed working before this doc was written): MySQL container reaches `healthy`, backend passes `/actuator/health`, frontend serves `index.html` (title `AI-CourtRoom`) via nginx, the seed script signs up all 3 roles through the real `/auth/signup` API and each subsequently logs in via the real `/auth/login` API (HTTP 200). The one shortcut taken is bypassing email/mobile OTP verification with a direct SQL update in the seed script, since there's no real mailbox/SMS provider in a local sandbox — production signups still go through the full OTP flow.

To add the in-app Gemini chatbot, put a real key in your local `.env` as `GEMINI_API_KEY` (never commit it) and re-run `docker compose up -d backend`. Everything else in the demo works without it.

To stop and remove the stack: `docker compose down` (add `-v` to also drop the DB volume and start fresh next time).

---

## Hosted demo (fallback)

The backend and AI service are on Render's free tier and **sleep when idle**. The documented demo accounts are provisioned automatically on Render. **Warm both services first**:

1. Open the frontend: <https://ai-court-room-iota.vercel.app/>
2. Hit the backend health once and wait for it to wake:
   `https://ai-court-g20y.onrender.com/actuator/health`
3. Hit the AI health once: `https://ai-court-ai.onrender.com/api/health`

Cold starts can exceed two minutes. Do not start the hosted walkthrough until both health endpoints return HTTP 200; once warm, they stay up for the session.

> If a service returns `503` **instantly and repeatedly** (not a slow wake), it's suspended — revive it from the Render dashboard before demoing. If it just times out with no response at all after a minute or more, check the Render dashboard directly; the service may need a manual restart.

---

## The 5-minute path

### 1. Framing (30s)
> "AI Courtroom is a legal-tech platform with role-based workflows for litigants, lawyers, and judges, plus a retrieval-augmented legal AI. The interesting part isn't the CRUD — it's that the AI **verifies its own citations** and the whole thing runs as three independently deployed, observable services."

### 2. Role-based login (60s)
Log in as each role to show the distinct dashboards:

| Role | Email | Password |
|------|-------|----------|
| User | `user@example.com` | `password123` |
| Lawyer | `lawyer@example.com` | `password123` |
| Judge | `judge@example.com` | `password123` |

Point out: JWT auth, role-based routing, different data and actions per role.

### 3. The AI legal Q&A (the headline — 90s)
Ask a question that has a clear statutory answer so the **citation guard** is visible. Sample prompts:

- *"What is the punishment for cheating under the Indian Penal Code?"*
- *"What are the essential elements of a valid contract?"*
- *"What remedies are available for breach of contract?"*

While it responds, narrate what's happening under the hood:
> "This isn't one LLM call. It runs a dense embedding search and a keyword search in parallel, fuses them with Reciprocal Rank Fusion, generates a grounded answer, then checks every case and section it cited against the retrieved sources. If it cites something that isn't in the sources, it flags it as unverified rather than pretending it's real."

### 4. Real-time chat (45s)
Open a user↔lawyer conversation to show the **WebSocket/STOMP** live messaging (open two browser profiles side by side if you want the live effect).

### 5. The engineering story (75s)
This is what separates it from a bootcamp project. Show the repo and call out:
- **CI/CD badges** on the README (Maven build, CodeQL; AI service adds ruff/mypy/pytest/pip-audit/Docker/Trivy).
- **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** — hybrid retrieval, citation faithfulness, a per-host Resilience4j circuit breaker + bounded-retry resilience, pluggable Redis/in-memory rate limiting, Prometheus + Sentry observability.
- Two deliberate AI paths (cheap Gemini chatbot vs. heavy RAG service) and *why*.

---

## If you record a Loom

Suggested 3-minute outline:
1. **0:00–0:20** — one-sentence pitch + the architecture diagram from the README.
2. **0:20–1:00** — log in across the three roles.
3. **1:00–2:15** — ask a legal question; explain hybrid retrieval + citation verification while it runs.
4. **2:15–2:45** — show real-time chat.
5. **2:45–3:00** — flip to ARCHITECTURE.md and name three senior decisions (RRF fusion, citation guard, per-host circuit breaker). Close on the CI badges.

---

## Talking points if asked "what would you do next?"

Be honest — interviewers reward it:
- Move the demo off free-tier hosting so it never cold-starts (biggest UX win).
- Add a real evaluation harness for AI answer quality (precision of citations, grounding rate).
- Introduce a frontend test suite (currently none).
- Add document upload so cases carry evidence into the AI context.
