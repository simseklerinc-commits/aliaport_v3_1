// Auth Module - LoginForm Component Tests
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../test-utils';
import { LoginForm } from '../components/LoginForm';
import { authService } from '../services/authService';
import { tokenStorage } from '../utils/tokenStorage';

// Mock external dependencies
jest.mock('../services/authService');
jest.mock('../utils/tokenStorage');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LoginForm', () => {
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenStorage.getAccessToken.mockReturnValue(null);
  });

  describe('Component Rendering', () => {
    it('should render login form with all elements', () => {
      render(<LoginForm />);

      // Check for branding
      expect(screen.getByText('Aliaport')).toBeInTheDocument();
      expect(screen.getByText('Liman Yönetim Sistemi')).toBeInTheDocument();

      // Check for form fields
      expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument();

      // Check for submit button
      expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument();
    });

    it('should render input placeholders correctly', () => {
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText(/kullanici@aliaport.com/i);
      const passwordInput = screen.getByLabelText(/şifre/i);

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should show "already logged in" message when authenticated', () => {
      // Mock authenticated state
      mockTokenStorage.getAccessToken.mockReturnValue('fake-token');
      
      render(<LoginForm />);

      expect(screen.getByText(/zaten giriş yapıldı/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-posta/i);
      const submitButton = screen.getByRole('button', { name: /giriş yap/i });

      // Enter invalid email
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText(/geçerli bir e-posta giriniz/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for empty password', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-posta/i);
      const submitButton = screen.getByRole('button', { name: /giriş yap/i });

      // Enter valid email but no password
      await user.type(emailInput, 'test@aliaport.com');
      await user.click(submitButton);

      // Check for password validation error
      await waitFor(() => {
        expect(screen.getByText(/şifre zorunludur/i)).toBeInTheDocument();
      });
    });

    it('should not show validation errors with valid inputs', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockResolvedValue({
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer',
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-posta/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const submitButton = screen.getByRole('button', { name: /giriş yap/i });

      await user.type(emailInput, 'test@aliaport.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should not show validation errors
      await waitFor(() => {
        expect(screen.queryByText(/geçerli bir e-posta giriniz/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/şifre zorunludur/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Login Flow', () => {
    it('should call login service with correct credentials on submit', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockResolvedValue({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        token_type: 'bearer',
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-posta/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const submitButton = screen.getByRole('button', { name: /giriş yap/i });

      // Fill form and submit
      await user.type(emailInput, 'admin@aliaport.com');
      await user.type(passwordInput, 'admin123');
      await user.click(submitButton);

      // Verify login was called with correct credentials
      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: 'admin@aliaport.com',
          password: 'admin123',
        });
      });
    });

    it('should disable submit button during login attempt', async () => {
      const user = userEvent.setup();
      
      // Make login take time to resolve
      mockAuthService.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-posta/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const submitButton = screen.getByRole('button', { name: /giriş yap/i });

      await user.type(emailInput, 'test@aliaport.com');
      await user.type(passwordInput, 'password');
      await user.click(submitButton);

      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-posta/i);
      const passwordInput = screen.getByLabelText(/şifre/i);

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });

    it('should have proper input types', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-posta/i);
      const passwordInput = screen.getByLabelText(/şifre/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });
});
