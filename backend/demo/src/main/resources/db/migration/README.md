# Flyway migrations

Versioned SQL migrations live here as `V<version>__<description>.sql`
(for example `V2__add_case_status_index.sql`).

Flyway is **disabled by default**. Enable it per the staged cutover documented in
`application.properties`:

1. Deploy with `FLYWAY_ENABLED=true`. Because `baseline-on-migrate=true` and
   `baseline-version=1`, Flyway stamps the existing production schema as the
   baseline (V1) without touching data, then applies any `V2+` scripts found here.
2. After Flyway owns the schema, set `DDL_AUTO=validate` so Hibernate only verifies
   the schema instead of mutating it.

Until enabled, the schema continues to be managed by Hibernate `ddl-auto`.
The first real migration script should be numbered `V2` or higher.
