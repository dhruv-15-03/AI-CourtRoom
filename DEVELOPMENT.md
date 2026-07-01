# Development Guide

This guide covers running **AI Courtroom** locally, the environment variables each tier needs, and common troubleshooting. The repo has two runnable tiers (React frontend, Spring Boot backend); the ML/LLM service lives in [AI-court-AI](https://github.com/dhruv-15-03/AI-court-AI) and can be pointed at the hosted URL instead of run locally.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | frontend (CRA / `react-scripts` 5) |
| Java (JDK) | 21 | backend (`java.version=21` in `pom.xml`) |
| Maven | 3.9+ | backend build |
| MySQL | 8 | primary datastore; an H2 dependency is bundled for a quick fallback |
| Redis | 6+ | *optional* — rate limiting falls back to in-memory if absent |
| Docker | recent | *optional* — `backend/demo/docker-compose.yaml` runs DB + app |

---

## 1. Backend — `backend/demo/`

Runs on **`http://localhost:8081`** (`server.port=${PORT:8081}`).

```bash
cd backend/demo
cp .env.example .env       # then edit .env
mvn spring-boot:run
```

The backend loads `.env` via `spring-dotenv`. Key variables (see `.env.example` for the full list):

| Variable | Purpose |
|----------|---------|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` | signing key for stateless auth tokens |
| `AI_SERVICE_URL` | ML/LLM microservice base (e.g. `https://ai-court-ai.onrender.com/api`) |
| `AI_SERVICE_API_KEY` | server-to-server key for the AI microservice |
| `GEMINI_API_KEY` / `GEMINI_API_MODEL` | direct Gemini assistant chatbot (`/api/ai`) — see [`GEMINI_AI_SETUP.md`](GEMINI_AI_SETUP.md) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | payments |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP notifications |
| `FIREBASE_*` | phone-auth (Firebase Admin) |

**Health & metrics:** `GET /actuator/health`, `GET /actuator/prometheus`.

**Database migrations:** Flyway is bundled and **opt-in** via `FLYWAY_ENABLED` (see `application.properties`). With a fresh MySQL, enable it to apply the versioned schema.

**Build a jar / run tests:**
```bash
mvn clean verify      # compile + tests + JaCoCo coverage report
mvn clean package     # produce target/*.jar
```

---

## 2. Frontend — `frontend/`

Runs on **`http://localhost:3000`**.

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

Environment variables (all `REACT_APP_*`, injected at build time by CRA):

| Variable | Default | Purpose |
|----------|---------|---------|
| `REACT_APP_API_URL` | `http://localhost:8081` | backend base URL |
| `REACT_APP_AI_API_URL` | `https://ai-court-ai.onrender.com/api` | AI microservice base URL |
| `REACT_APP_WS_URL` | `http://localhost:8081/ws` | WebSocket endpoint |
| `REACT_APP_ENABLE_AI_FEATURES` | `true` | toggle AI UI |
| `REACT_APP_ENABLE_VIDEO_CALLS` | `false` | video calls (scaffold, off) |
| `REACT_APP_DEBUG` | `true` locally | verbose logging |

The API wiring lives in `frontend/src/services/api.js` — two Axios instances (`api` → backend, `aiApi` → AI service) plus JWT interceptors.

**Build for production:**
```bash
npm run build         # outputs ./build (Vercel serves this)
```

> Note: the test scripts are `test` and `test:ci`. The suite currently runs with `--passWithNoTests`; there is no meaningful automated frontend test coverage yet. Don't quote a coverage number you can't back up.

---

## 3. AI microservice (optional, for full local RAG)

Clone and run [AI-court-AI](https://github.com/dhruv-15-03/AI-court-AI) separately, or just point `REACT_APP_AI_API_URL` / `AI_SERVICE_URL` at the hosted Render URL. It exposes Flask blueprints for `analysis`, `agent`, `search`, `feedback`, `audit`, and `monitoring`, with health probes at `/api/health`, `/api/health/ready`, and `/api/health/live`.

---

## Running with Docker (backend)

```bash
cd backend/demo
docker compose up --build
```

This brings up the database and the Spring Boot app together (see `docker-compose.yaml`).

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| Frontend loads but every API call fails | Backend not running, or `REACT_APP_API_URL` wrong. Check `GET /actuator/health`. |
| Hosted demo returns `503` for ~30–60s then works | Render free-tier cold start. Retry after the service wakes. |
| Hosted demo returns `503` **instantly, repeatedly** | Service is down/suspended (not sleeping) — check the Render dashboard. |
| Backend won't start | Missing DB env vars, or MySQL unreachable. Verify `.env`, or use the H2 fallback for a quick boot. |
| Rate-limit `429`s locally | Expected — the rate-limit filter is active. Redis is optional; it falls back to in-memory. |
| AI answers are slow on first call | LLM cold start + model load. Timeouts are bounded under the gunicorn worker limit. |

---

## Git / contribution conventions

- Feature branches off `main`; open a PR; CI must be green before merge.
- **Conventional Commits** style for messages.
- Backend CI runs Maven build + CodeQL; the AI service runs `ruff`/`mypy`/`pytest`/`pip-audit`/Docker/Trivy/CodeQL.
