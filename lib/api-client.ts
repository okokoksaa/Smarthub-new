import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { io, Socket } from 'socket.io-client';

// API client configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add constituency header if available
      const constituencyId = localStorage.getItem('constituencyId');
      if (constituencyId) {
        config.headers['X-Constituency-ID'] = constituencyId;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle auth errors and token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // If 401 and we have a refresh token, try to refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            // Update stored tokens
            localStorage.setItem('accessToken', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return instance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // Trigger logout event
            window.dispatchEvent(new CustomEvent('auth:logout'));
            
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token, redirect to login
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Create the API client instance
export const apiClient = createApiClient();

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    const firstError = Object.values(errors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0];
    }
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Generic API request wrapper
export const apiRequest = async <T = any>(
  requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  try {
    const response = await requestFn();
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Request failed');
    }
    
    return response.data.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Paginated API request wrapper
export const paginatedApiRequest = async <T = any>(
  requestFn: () => Promise<AxiosResponse<PaginatedResponse<T>>>
): Promise<{ data: T[]; pagination: any }> => {
  try {
    const response = await requestFn();
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Request failed');
    }
    
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// WebSocket client for real-time features
class SocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      const token = localStorage.getItem('accessToken');
      
      this.socket = io(WS_URL, {
        auth: {
          token: token
        },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      // Handle auth errors
      this.socket.on('auth_error', () => {
        console.error('WebSocket authentication failed');
        this.disconnect();
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Event not sent:', event);
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback?: Function) {
    if (callback) {
      const listeners = this.listeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      this.socket?.off(event, callback as any);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  // Convenience methods for common events
  onNotification(callback: (notification: any) => void) {
    this.on('notification', callback);
  }

  onProjectUpdate(callback: (project: any) => void) {
    this.on('project:updated', callback);
  }

  onPaymentStatusUpdate(callback: (payment: any) => void) {
    this.on('payment:status_updated', callback);
  }

  onUserStatusUpdate(callback: (user: any) => void) {
    this.on('user:status_updated', callback);
  }

  // Subscribe to constituency-specific events
  joinConstituencyRoom(constituencyId: string) {
    this.emit('join:constituency', { constituencyId });
  }

  leaveConstituencyRoom(constituencyId: string) {
    this.emit('leave:constituency', { constituencyId });
  }
}

// Create singleton instance
export const socketManager = new SocketManager();