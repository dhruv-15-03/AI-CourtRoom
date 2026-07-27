import http from 'k6/http';
import { check, sleep } from 'k6';

// Real k6 load test for the lawyer dashboard endpoint.
// TARGET_URL and JWT are injected via environment variables.
const BASE_URL = __ENV.TARGET_URL || 'http://host.docker.internal:18090';
const TOKEN = __ENV.JWT_TOKEN;

export const options = {
  scenarios: {
    fixed_concurrency: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<1.0'], // do not abort early; we WANT to see real failure rates
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/lawyer/dashboard`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.1);
}
