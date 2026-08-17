import { agentErrorMessage, AGENT_UNAVAILABLE_MESSAGE } from './serviceErrors';

const withStatus = (status, data) => ({ response: { status, data } });

describe('agentErrorMessage', () => {
  it('maps the backend 503 outage payload to the friendly message', () => {
    expect(agentErrorMessage(withStatus(503, { error: 'service_unavailable' })))
      .toBe(AGENT_UNAVAILABLE_MESSAGE);
  });

  it('treats network errors with no response as an outage', () => {
    expect(agentErrorMessage(new Error('Network Error'))).toBe(AGENT_UNAVAILABLE_MESSAGE);
  });

  it.each([500, 502, 504, 408, 429])('treats %i as an outage', (status) => {
    expect(agentErrorMessage(withStatus(status, {}))).toBe(AGENT_UNAVAILABLE_MESSAGE);
  });

  it('quotes a genuine client-side message from the server', () => {
    expect(agentErrorMessage(withStatus(400, { message: 'Case details are required' })))
      .toBe('Case details are required');
  });

  it('falls back when a 4xx carries no usable detail', () => {
    expect(agentErrorMessage(withStatus(422, {}), 'Could not draft that'))
      .toBe('Could not draft that');
  });

  it('ignores blank server details', () => {
    expect(agentErrorMessage(withStatus(400, { message: '   ' }))).toBe(AGENT_UNAVAILABLE_MESSAGE);
  });
});
