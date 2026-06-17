import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { useAuth } from '../contexts/AuthContext';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock('../contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

// FormWrapper only provides layout; render its children directly to isolate the page.
jest.mock('../components/FormWrapper', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

describe('LoginPage', () => {
  let login;

  beforeEach(() => {
    login = jest.fn();
    useAuth.mockReturnValue({ login, loading: false, error: null });
    mockNavigate.mockClear();
  });

  test('renders the email, password and sign-in controls', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('blocks submission and shows validation errors when fields are empty', async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  test('submits the credentials and navigates home on success', async () => {
    login.mockResolvedValue({ success: true });
    const showNotification = jest.fn();

    render(<LoginPage showNotification={showNotification} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret1');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret1',
      })
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });
});
