import * as axiosMock from 'axios';
import { TextDecoder, TextEncoder } from 'util';
import {
  agentService,
  getConfidenceDisplay,
  PREDICTION_OUTCOMES,
  CASE_TYPES,
} from './api';

// Mock the monitoring logger so the interceptors don't emit real log output.
jest.mock('../utils/monitoring', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

// Replace axios with a fake whose interceptor handlers we can capture and invoke.
jest.mock('axios', () => {
  const handlers = { request: [], response: [] };
  const instance = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: {
        use: (onFulfilled, onRejected) =>
          handlers.request.push({ onFulfilled, onRejected }),
      },
      response: {
        use: (onFulfilled, onRejected) =>
          handlers.response.push({ onFulfilled, onRejected }),
      },
    },
  };
  return {
    __esModule: true,
    default: { create: jest.fn(() => instance) },
    __handlers: handlers,
    __instance: instance,
  };
});

const requestInterceptor = axiosMock.__handlers.request[0];
const responseInterceptor = axiosMock.__handlers.response[0];

describe('getConfidenceDisplay', () => {
  test.each([
    [0.95, 'Very High'],
    [0.8, 'High'],
    [0.65, 'Moderate'],
    [0.45, 'Low'],
    [0.1, 'Very Low'],
  ])('maps confidence %p to "%s"', (confidence, level) => {
    expect(getConfidenceDisplay(confidence).level).toBe(level);
  });

  test('exposes prediction outcome and case-type constants', () => {
    expect(PREDICTION_OUTCOMES).toContain('Bail Granted');
    expect(CASE_TYPES).toEqual(
      expect.arrayContaining(['Criminal', 'Civil', 'Labor', 'Family'])
    );
  });
});

describe('request interceptor', () => {
  beforeEach(() => localStorage.clear());

  test('attaches a bearer token when one is stored', () => {
    localStorage.setItem('authToken', 'abc123');
    const config = requestInterceptor.onFulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer abc123');
  });

  test('leaves the Authorization header unset when no token is stored', () => {
    const config = requestInterceptor.onFulfilled({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('response interceptor', () => {
  const originalLocation = window.location;

  beforeAll(() => {
    delete window.location;
    window.location = { href: 'http://localhost/', assign: jest.fn(), reload: jest.fn() };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    localStorage.clear();
    window.location.href = 'http://localhost/';
  });

  test('forces logout on a 401 response', async () => {
    localStorage.setItem('authToken', 'abc');
    localStorage.setItem('userRole', 'user');
    localStorage.setItem('userProfile', '{}');

    const events = [];
    const listener = () => events.push(1);
    window.addEventListener('forceLogout', listener);

    const error = {
      config: { url: '/api/cases/all', method: 'get' },
      response: { status: 401, data: {} },
      message: 'Unauthorized',
    };

    await expect(responseInterceptor.onRejected(error)).rejects.toBe(error);

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userRole')).toBeNull();
    expect(localStorage.getItem('userProfile')).toBeNull();
    expect(events).toHaveLength(1);
    expect(window.location.href).toBe('/login');

    window.removeEventListener('forceLogout', listener);
  });

  test('does not force logout on a subscription/access 403', async () => {
    localStorage.setItem('authToken', 'keep');

    const error = {
      config: { url: '/api/cases/all' },
      response: {
        status: 403,
        data: { message: 'Upgrade your plan to access this feature' },
      },
      message: 'Forbidden',
    };

    await expect(responseInterceptor.onRejected(error)).rejects.toBe(error);

    expect(localStorage.getItem('authToken')).toBe('keep');
    expect(window.location.href).toBe('http://localhost/');
  });
});

describe('agentService.stream', () => {
  const originalFetch = global.fetch;
  const originalTextDecoder = global.TextDecoder;
  const originalTextEncoder = global.TextEncoder;

  const streamResponse = (chunks) => {
    let index = 0;
    return {
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: jest.fn(async () => (
            index < chunks.length
              ? { done: false, value: chunks[index++] }
              : { done: true, value: undefined }
          )),
        }),
      },
    };
  };

  beforeAll(() => {
    global.TextDecoder = TextDecoder;
    global.TextEncoder = TextEncoder;
  });

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    global.TextDecoder = originalTextDecoder;
    global.TextEncoder = originalTextEncoder;
  });

  test('dispatches status, citations, token, and done metadata across stream boundaries', async () => {
    const status = { step: 'case_search', message: 'Searching case law...' };
    const citations = {
      cases: [{ title: 'Maneka Gandhi v. Union of India' }],
      statutes_excerpt: 'Article 21',
      grounded: false,
      unverified_citations: ['Invented Authority v. State'],
    };
    const token = { text: 'The answer is grounded in Article 21.' };
    const metadata = {
      model: 'test-model',
      provider: 'test-provider',
      citation_count: 1,
      elapsed_seconds: 0.2,
      session_id: 'session-123',
    };
    const payload = [
      `event: status\r\ndata: ${JSON.stringify(status)}\r\n\r\n`,
      `event: citations\r\ndata: ${JSON.stringify(citations)}\r\n\r\n`,
      `event: token\r\ndata: ${JSON.stringify(token)}\r\n\r\n`,
      `event: done\r\ndata: ${JSON.stringify(metadata)}`,
    ].join('');
    const bytes = new TextEncoder().encode(payload);
    const chunks = [
      bytes.slice(0, 23),
      bytes.slice(23, 91),
      bytes.slice(91, 197),
      bytes.slice(197),
    ];
    global.fetch.mockResolvedValue(streamResponse(chunks));

    const onStatus = jest.fn();
    const onCitations = jest.fn();
    const onToken = jest.fn();
    const onDone = jest.fn();
    const receivedMetadata = new Promise((resolve) => onDone.mockImplementation(resolve));

    agentService.stream(
      { query: 'Explain Article 21', sessionId: 'existing-session', kCases: 3, kStatutes: 2 },
      { onStatus, onCitations, onToken, onDone }
    );

    await expect(receivedMetadata).resolves.toEqual(metadata);
    expect(onStatus).toHaveBeenCalledWith(status);
    expect(onCitations).toHaveBeenCalledWith(citations);
    expect(onToken).toHaveBeenCalledWith(token);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/agent\/stream$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          query: 'Explain Article 21',
          session_id: 'existing-session',
          k_cases: 3,
          k_statutes: 2,
        }),
      })
    );
  });

  test('dispatches an SSE error event without converting its payload', async () => {
    const streamError = { message: 'LLM provider unavailable', code: 'provider_error' };
    const payload = `event: error\ndata: ${JSON.stringify(streamError)}\n\n`;
    global.fetch.mockResolvedValue(
      streamResponse([new TextEncoder().encode(payload)])
    );

    const onError = jest.fn();
    const receivedError = new Promise((resolve) => onError.mockImplementation(resolve));

    agentService.stream({ query: 'Explain anticipatory bail' }, { onError });

    await expect(receivedError).resolves.toEqual(streamError);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
