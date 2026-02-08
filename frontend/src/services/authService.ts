 // API calls for user registration, login, profile management, and logout.

import apiClient, { tokenManager } from './apiClient';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_picture: string | null;
  bio: string;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  status: string;
  message?: string;
  data: {
    user: User;
    tokens: {
      access: string;
      refresh: string;
    };
  };
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  bio?: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await apiClient.post('/users/register/', data);
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user and store tokens
   */
  async login(data: LoginData): Promise<{ user: User; tokens: { access: string; refresh: string } }> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/login/', data);
      const { user, tokens } = response.data.data;

      // Store tokens
      tokenManager.setTokens(tokens.access, tokens.refresh);

      return { user, tokens };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user and clear tokens
   */
  logout(): void {
    tokenManager.clearTokens();
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get('/users/profile/');
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateData): Promise<User> {
    try {
      const response = await apiClient.patch('/users/profile/', data);
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return tokenManager.getAccessToken();
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || error.response.data?.errors || 'An error occurred';
      return new Error(JSON.stringify(message));
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new AuthService();
