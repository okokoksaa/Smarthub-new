import { apiClient, apiRequest, ApiResponse } from '../api-client';

// Auth types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  roles: string[];
  tenantScopeLevel: string;
  isActive: boolean;
  isVerified: boolean;
  mfaEnabled: boolean;
  profilePhotoUrl?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresMfa: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber: string;
  role: string;
  tenantScopeLevel: string;
  nationalIdNumber?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface MfaSetupResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface VerifyMfaRequest {
  code: string;
}

// Auth API class
export class AuthApi {
  // Login user
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    
    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }

    // Store tokens and user data
    if (!data.data.requiresMfa) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data.data;
  }

  // Register new user
  static async register(userData: RegisterRequest): Promise<User> {
    return apiRequest(() => 
      apiClient.post<ApiResponse<User>>('/auth/register', userData)
    );
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>('/auth/refresh', {
        refreshToken
      })
    );
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Get current user profile
  static async getProfile(): Promise<User> {
    return apiRequest(() =>
      apiClient.get<ApiResponse<User>>('/auth/profile')
    );
  }

  // Update user profile
  static async updateProfile(updates: Partial<User>): Promise<User> {
    return apiRequest(() =>
      apiClient.patch<ApiResponse<User>>('/auth/profile', updates)
    );
  }

  // Change password
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<void>>('/auth/change-password', data)
    );
  }

  // Request password reset
  static async requestPasswordReset(data: ResetPasswordRequest): Promise<void> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<void>>('/auth/forgot-password', data)
    );
  }

  // Confirm password reset
  static async confirmPasswordReset(data: ConfirmResetPasswordRequest): Promise<void> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<void>>('/auth/reset-password', data)
    );
  }

  // Verify email
  static async verifyEmail(token: string): Promise<void> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<void>>('/auth/verify-email', { token })
    );
  }

  // Resend verification email
  static async resendVerification(email: string): Promise<void> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<void>>('/auth/resend-verification', { email })
    );
  }

  // MFA Methods
  
  // Setup MFA
  static async setupMfa(): Promise<MfaSetupResponse> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<MfaSetupResponse>>('/auth/mfa/setup')
    );
  }

  // Verify MFA setup
  static async verifyMfaSetup(data: VerifyMfaRequest): Promise<{ backupCodes: string[] }> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<{ backupCodes: string[] }>>('/auth/mfa/verify-setup', data)
    );
  }

  // Disable MFA
  static async disableMfa(data: VerifyMfaRequest): Promise<void> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<void>>('/auth/mfa/disable', data)
    );
  }

  // Generate new backup codes
  static async generateBackupCodes(): Promise<{ backupCodes: string[] }> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<{ backupCodes: string[] }>>('/auth/mfa/backup-codes')
    );
  }

  // Complete MFA login
  static async completeMfaLogin(sessionToken: string, mfaCode: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/mfa/verify', {
      sessionToken,
      code: mfaCode
    });

    if (data.success) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data.data;
  }
}

// Default export
export default AuthApi;