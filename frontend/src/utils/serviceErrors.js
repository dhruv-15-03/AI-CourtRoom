/**
 * Shared helpers for surfacing AI agent-service failures to the user.
 *
 * The `/api/agent/*` endpoints are proxied by the Spring backend to a separate
 * Python service. When that hop is unreachable or misconfigured the backend
 * answers `503 {"error":"service_unavailable"}`.
 *
 * Several screens used to swallow those failures, which left the UI rendering a
 * normal, apparently-working form for a feature that could not run. Prefer
 * these helpers so every agent-backed screen says the same calm, honest thing.
 */

export const AGENT_UNAVAILABLE_MESSAGE =
  'The AI service is temporarily unavailable. Please try again in a few minutes.';

/**
 * Treat missing statuses (network error / timeout / CORS), timeouts, rate
 * limiting and any 5xx as "the service is down", rather than something the user
 * did wrong. Anything else is a genuine client-side problem worth quoting.
 */
const isOutageStatus = (status) =>
  !status || status === 408 || status === 429 || status >= 500;

/**
 * Turn an agent-service error into a message that is safe to show a user.
 *
 * Server payloads for outages carry machine strings such as
 * `service_unavailable`; those are replaced with the friendly message rather
 * than leaked into the UI.
 *
 * @param {unknown} error   Error thrown by axios.
 * @param {string} fallback Message for a 4xx with no usable server detail.
 * @returns {string}
 */
export function agentErrorMessage(error, fallback = AGENT_UNAVAILABLE_MESSAGE) {
  const status = error?.response?.status;
  if (isOutageStatus(status)) return AGENT_UNAVAILABLE_MESSAGE;

  const data = error?.response?.data;
  const detail = data?.message || data?.error || data?.detail;
  return typeof detail === 'string' && detail.trim() ? detail : fallback;
}
