/**
 * Centralized API Client for CDF Smart Hub
 *
 * This client handles all HTTP requests to the backend API Gateway,
 * including authentication, error handling, and request/response transformation.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import { supabase } from '@/integrations/supabase/client'

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000/api/v1'

/**
 * Create axios instance with default configuration
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor: Add JWT token from Supabase Auth
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }

      // Add request ID for tracing
      config.headers['X-Request-ID'] = crypto.randomUUID()

      return config
    } catch (error) {
      console.error('Failed to attach auth token:', error)
      return config
    }
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor: Handle errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError || !session) {
          // Refresh failed, redirect to login
          await supabase.auth.signOut()
          window.location.href = '/auth'
          return Promise.reject(error)
        }

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`
        }

        return apiClient(originalRequest)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        await supabase.auth.signOut()
        window.location.href = '/auth'
        return Promise.reject(error)
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred'

    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    })

    return Promise.reject(error)
  }
)

/**
 * API Client Methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return apiClient.get<T>(url, config)
  },

  /**
   * POST request
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return apiClient.post<T>(url, data, config)
  },

  /**
   * PATCH request
   */
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return apiClient.patch<T>(url, data, config)
  },

  /**
   * PUT request
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return apiClient.put<T>(url, data, config)
  },

  /**
   * DELETE request
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return apiClient.delete<T>(url, config)
  },
}

/**
 * Check if API client should be used for a specific operation
 *
 * Use API for:
 * - Payments (security critical)
 * - Approvals (workflow enforcement)
 * - Financial operations (validation required)
 * - User management (role assignment)
 *
 * Use direct Supabase for:
 * - Simple reads (geography, lookup tables)
 * - Real-time subscriptions
 * - File uploads (if not sensitive)
 */
export const shouldUseAPI = (operation: string): boolean => {
  const apiOperations = [
    'payment',
    'approve',
    'disburse',
    'budget',
    'user_role',
    'assignment',
    'workflow',
  ]

  return apiOperations.some(op => operation.toLowerCase().includes(op))
}

export default api
