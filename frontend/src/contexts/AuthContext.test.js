import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authService, userService } from '../services/api';

jest.mock('../services/api', () => ({
  authService: { login: jest.fn(), register: jest.fn(), logout: jest.fn() },
  userService: { getProfile: jest.fn() },
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('useAuth', () => {
  test('throws when used outside an AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    spy.mockRestore();
  });

  test('starts unauthenticated by default', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});

describe('AuthProvider hydration', () => {
  test('restores session from localStorage on mount', async () => {
    localStorage.setItem('authToken', 'tok123');
    localStorage.setItem('userRole', 'lawyer');
    localStorage.setItem(
      'userProfile',
      JSON.stringify({ name: 'Asha', email: 'asha@law.in' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.token).toBe('tok123');
    expect(result.current.user).toMatchObject({
      role: 'lawyer',
      name: 'Asha',
      email: 'asha@law.in',
    });
  });

  test('logs out when a forceLogout event is dispatched', async () => {
    localStorage.setItem('authToken', 'tok');
    localStorage.setItem('userRole', 'user');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      window.dispatchEvent(new CustomEvent('forceLogout'));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe('login', () => {
  test('maps the backend role to a frontend role and persists the session', async () => {
    authService.login.mockResolvedValue({ data: { token: 'jwt-1', message: 'ok' } });
    userService.getProfile.mockResolvedValue({
      data: { role: 'JUDGE', name: 'Judge J', email: 'judge@court.in' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res;
    await act(async () => {
      res = await result.current.login({ email: 'Judge@Court.in', password: 'secret' });
    });

    expect(res).toEqual({ success: true, message: 'ok' });
    // email is lower-cased before being sent to the backend
    expect(authService.login).toHaveBeenCalledWith({
      email: 'judge@court.in',
      password: 'secret',
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.role).toBe('judge');
    expect(localStorage.getItem('authToken')).toBe('jwt-1');
    expect(localStorage.getItem('userRole')).toBe('judge');
  });

  test('records the error and returns failure when the backend rejects', async () => {
    authService.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res;
    await act(async () => {
      res = await result.current.login({ email: 'x@y.com', password: 'bad' });
    });

    expect(res).toEqual({ success: false, error: 'Invalid credentials' });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  test('surfaces the verification flow on a 403 requiresVerification response', async () => {
    authService.login.mockRejectedValue({
      response: {
        status: 403,
        data: {
          requiresVerification: true,
          email: 'new@user.com',
          emailVerified: false,
          mobileVerified: false,
          message: 'Please verify your account',
        },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res;
    await act(async () => {
      res = await result.current.login({ email: 'new@user.com', password: 'pw' });
    });

    expect(res).toMatchObject({
      success: false,
      requiresVerification: true,
      email: 'new@user.com',
    });
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('register', () => {
  test('maps the frontend role to the backend role and stays unauthenticated', async () => {
    authService.register.mockResolvedValue({
      data: { message: 'verify', requiresVerification: true },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res;
    await act(async () => {
      res = await result.current.register({
        email: 'New@User.com',
        password: 'pw',
        role: 'lawyer',
        name: 'N',
      });
    });

    expect(authService.register).toHaveBeenCalledTimes(1);
    const payload = authService.register.mock.calls[0][0];
    expect(payload.role).toBe('ADVOCATE');
    expect(payload.email).toBe('new@user.com');
    expect(res.success).toBe(true);
    expect(res.requiresVerification).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('logout', () => {
  test('clears the session and notifies the auth service', async () => {
    localStorage.setItem('authToken', 'tok');
    localStorage.setItem('userRole', 'user');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
});
