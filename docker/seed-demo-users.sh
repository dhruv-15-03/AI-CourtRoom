#!/bin/sh
# Seeds the 3 demo accounts referenced in docs/DEMO.md against a freshly-started
# local compose stack: a citizen, a lawyer (ADVOCATE), and a judge, all password123.
#
# Uses the real /auth/signup + /auth/login API so password hashing and entity
# validation go through the actual application code -- not hand-written SQL.
# The one thing it bypasses via direct SQL is email/mobile OTP verification,
# which requires a real mailbox/SMS provider we don't have in a local demo.
# This bypass is demo-only; production accounts go through the real OTP flow.
#
# Safe to re-run: skips any account that already exists (409 from /auth/signup).

set -eu

BACKEND_URL="${BACKEND_URL:-http://backend:8081}"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-ai_courtroom}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-rootpass}"

echo "Waiting for backend at $BACKEND_URL/actuator/health ..."
for i in $(seq 1 60); do
  if wget -q -O- "$BACKEND_URL/actuator/health" 2>/dev/null | grep -q '"status":"UP"'; then
    echo "Backend is up."
    break
  fi
  sleep 2
  if [ "$i" -eq 60 ]; then
    echo "Backend did not become healthy in time." >&2
    exit 1
  fi
done

signup() {
  email="$1"; role="$2"; first="$3"; last="$4"
  echo "Signing up $email ($role) ..."
  code=$(curl -s -o /tmp/signup-resp.json -w '%{http_code}' -X POST "$BACKEND_URL/auth/signup" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"password123\",\"role\":\"$role\",\"firstName\":\"$first\",\"lastName\":\"$last\"}")
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "  created."
  elif [ "$code" = "409" ]; then
    echo "  already exists, skipping."
  else
    echo "  unexpected response ($code): $(cat /tmp/signup-resp.json)" >&2
  fi
}

signup "user@example.com" "CITIZEN" "Demo" "Citizen"
signup "lawyer@example.com" "ADVOCATE" "Demo" "Lawyer"
signup "judge@example.com" "JUDGE" "Demo" "Judge"

echo "Marking demo accounts as verified (demo-only OTP bypass) ..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
  UPDATE app_user
     SET is_verified = 1, email_verified = 1, mobile_verified = 1
   WHERE email IN ('user@example.com', 'lawyer@example.com', 'judge@example.com');
"

echo "Done. Demo logins (see docs/DEMO.md):"
echo "  user@example.com   / password123"
echo "  lawyer@example.com / password123"
echo "  judge@example.com  / password123"
