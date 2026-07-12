# Performance Baseline: Lawyer Dashboard N+1 Fixes

Real, measured before/after numbers for the three N+1 / lazy-loading fixes shipped in
PR #52 (`93d7813`) and PR #53 (`69e568b`):

- `GET /api/lawyer/dashboard`
- `GET /api/lawyer/case-requests`
- `GET /api/lawyer/chats`

**Methodology — real instances, no fabricated numbers.** Two standalone Spring Boot
instances were built from git worktrees of this repo and run side by side against the
same MySQL 8 database, same JWT secret, and same seeded data:

- **BEFORE**: jar built from `6a8642a` (parent of the first N+1 fix, PR #51) — port `18090`.
- **AFTER**: jar built from current `main` (`69e568b`) — port `18091`.
- DB: a dedicated `perftest` schema in the local MySQL 8 container, seeded with 1 lawyer
  user, 1 client user, and a range of `court_case` / `case_request` rows (see below).
- Load generator: [k6](https://k6.io) (`grafana/k6` Docker image), 20 constant VUs for 30s,
  hitting the real HTTP endpoints with a real signed JWT obtained via `/auth/login`.
- All numbers below are copy-pasted from actual k6/curl output, not estimated.

## Finding 1 — `case-requests` and `chats` were completely broken before the fix

This is a bigger issue than N+1 latency: with `spring.jpa.open-in-view=false` (already
set in `application.properties`), the pre-fix code loaded `CaseRequest` rows with
`findByLawyer(lawyer)` (no fetch join) and then called `request.getUser()` **after** the
repository transaction had already closed. Every real call hit Hibernate's
`LazyInitializationException`-equivalent:

```
BEFORE (port 18090, commit 6a8642a):
GET /api/lawyer/case-requests -> HTTP 400
{"error":"Could not initialize proxy [com.example.demo.Classes.User#2] - no session"}

GET /api/lawyer/chats -> HTTP 400
{"error":"Could not initialize proxy [com.example.demo.Classes.User#2] - no session"}
```

SQL log for the BEFORE `case-requests` call confirms only the bare `case_request` query
ran (no user data fetched) before the controller crashed:

```sql
select cr1_0.id, cr1_0.budget, ... , cr1_0.user_id
from case_request cr1_0
where cr1_0.lawyer_id=?
order by cr1_0.requested_at desc
```

```
AFTER (port 18091, commit 69e568b):
GET /api/lawyer/case-requests -> HTTP 200 (22,980 bytes, 60 requests returned)
GET /api/lawyer/chats         -> HTTP 200 (428 bytes, 3 chats returned)
```

SQL log for the AFTER call shows a single query with the JOIN FETCH doing the work in
one round trip instead of N+1 (and instead of crashing):

```sql
select cr1_0.*, u1_0.*
from case_request cr1_0
join app_user u1_0 on u1_0.id = cr1_0.user_id
where cr1_0.lawyer_id=?
order by cr1_0.requested_at desc
```

**Result: these two endpoints went from a 100% failure rate to a 100% success rate**,
in addition to going from N+1 queries (one query per distinct client, when the code did
run) to exactly 1 query.

## Finding 2 — dashboard: full-entity-fetch vs. indexed COUNT, measured at two data scales

The pre-fix dashboard loaded every case belonging to the lawyer (`findCasesByAdvocate`,
full entity, every column) and counted active/disposed with a Java `.stream()` filter.
The fix (`countActiveCasesByAdvocate` / `countDisposedCasesByAdvocate`) pushes the count
down to the DB as an indexed aggregate query.

At small data volume (150 cases) the two approaches are roughly comparable — the fixed
version issues 4 small queries instead of 1 big one, so round-trip overhead cancels out
the win:

| Cases seeded | Metric | BEFORE (6a8642a) | AFTER (69e568b) |
|---|---|---|---|
| 150 | p95 latency | 90.0 ms | 123.9 ms |
| 150 | throughput | 136.1 req/s | 128.4 req/s |

At realistic production volume (3,150 cases for one lawyer) the full-entity-fetch no
longer scales — every request re-transfers and re-hydrates every column of every case
row just to compute two counts — while the indexed COUNT queries stay flat:

| Cases seeded | Metric | BEFORE (6a8642a) | AFTER (69e568b) | Change |
|---|---|---|---|---|
| 3,150 | p50 latency | 151.7 ms | 69.7 ms | **-54%** |
| 3,150 | p95 latency | 280.5 ms | 165.5 ms | **-41%** |
| 3,150 | throughput (20 VUs, 30s) | 73.3 req/s | 109.6 req/s | **+50%** |
| 3,150 | error rate | 0% | 0% | — |

Raw k6 output for all four runs is preserved under `docs/perf/` for verification.

## Test setup details (for reproducibility)

- MySQL 8.0.42 (existing local `mysql-db` container), dedicated `perftest` schema.
- `JWT_SECRET` set to a fixed 44-char test value, identical for both instances.
- Both instances built with `mvnw clean package -DskipTests` — BEFORE from a git
  worktree pinned at `6a8642a`, AFTER from `main` at `69e568b`.
- Seed data: 1 lawyer (`perftestlawyer@example.com`), 1 client
  (`perftestclient@example.com`), 60 `case_request` rows (mixed `PENDING`/`ACCEPTED`),
  and 150 or 3,150 `court_case` rows (mixed active/disposed) linked to the lawyer via
  `user_case_requests`, inserted directly via SQL to keep the seeding fast and
  deterministic.
- k6 script: `docs/perf/dashboard-loadtest.js`, run via
  `docker run --rm -i grafana/k6 run dashboard-loadtest.js` with `TARGET_URL` and
  `JWT_TOKEN` env vars pointed at each instance in turn.
- Full k6 console output for all four runs (before/after x 150/3150 cases) is saved in
  `docs/perf/` for anyone who wants to verify these numbers.

## Takeaways

1. The N+1 sweep (PRs #51-#53) fixed a real production-breaking bug, not just a
   performance nit: `case-requests` and `chats` were unusable (100% error rate) before
   the fix.
2. The dashboard COUNT-query fix only pays off once a lawyer has a non-trivial case
   history — at low volume it's a wash, at ~3,000 cases it's a 41-54% latency cut and a
   50% throughput increase at fixed concurrency. This scaling behavior, not the small-N
   case, is the number worth quoting.
3. No fabricated numbers were used anywhere in this document — every figure above is
   copied directly from real k6/curl output against locally-running instances built from
   the actual before/after commits.
