import * as axiosMock from 'axios';
import { getConfidenceDisplay, PREDICTION_OUTCOMES, CASE_TYPES } from './api';

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
