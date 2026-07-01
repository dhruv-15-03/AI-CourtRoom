# Demo Walkthrough

A script for showing **AI Courtroom** to a recruiter, interviewer, or prospective client in ~5 minutes. It assumes the hosted demo, but every step works locally too (see [DEVELOPMENT.md](../DEVELOPMENT.md)).

## Before you start (60 seconds)

The backend and AI service are on Render's free tier and **sleep when idle**. **Warm them up first** so nothing 503s during the live demo:

1. Open the frontend: <https://ai-court-room-iota.vercel.app/>
2. Hit the backend health once and wait for it to wake:
   `https://ai-court-g20y.onrender.com/actuator/health`
3. Hit the AI health once: `https://ai-court-ai.onrender.com/api/health`

Give each 30–60s on the first request. Once warm, they stay up for the session.

> If a service returns `503` **instantly and repeatedly** (not a slow wake), it's suspended — revive it from the Render dashboard before demoing.

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
