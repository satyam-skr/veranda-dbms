import axios from 'axios';
import { API_CONFIG } from '@/config/api.config';

/**
 * API Client - Axios instance with interceptors
 * Handles authentication, error handling, and request/response transformation
 */

class ApiClient {
  constructor() {
    // Create axios instance
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Setup interceptors
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /**
   * Request Interceptor - Add auth token and log requests
   */
  setupRequestInterceptor() {
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for performance monitoring
        config.metadata = { startTime: new Date() };

        // Log request in development
        if (API_CONFIG.enableLogging) {
          console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        if (API_CONFIG.enableLogging) {
          console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Response Interceptor - Handle errors and transform responses
   */
  setupResponseInterceptor() {
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = new Date() - response.config.metadata.startTime;

        // Log response in development
        if (API_CONFIG.enableLogging) {
          console.log('✅ API Response:', {
            method: response.config.method?.toUpperCase(),
            url: response.config.url,
            status: response.status,
            duration: `${duration}ms`,
            data: response.data,
          });
        }

        return response;
      },
      (error) => {
        // Log error in development
        if (API_CONFIG.enableLogging) {
          console.error('❌ API Error:', {
            method: error.config?.method?.toUpperCase(),
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });
        }

        // Handle other errors
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Get authentication token from localStorage
   */
  getAuthToken() {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const { token } = JSON.parse(authData);
        return token;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return null;
  }

  /**
   * Transform API errors into user-friendly format
   */
  handleError(error) {
    const apiError = {
      message: 'An unexpected error occurred',
      status: null,
      code: null,
      errors: {},
    };

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      apiError.status = status;
      apiError.code = data?.code || data?.error_code;
      apiError.message = data?.message || this.getDefaultErrorMessage(status);
      apiError.errors = data?.errors || {};
      
    } else if (error.request) {
      // Request made but no response received
      apiError.message = 'Network error. Please check your internet connection.';
      apiError.code = 'NETWORK_ERROR';
      
    } else {
      // Error in request setup
      apiError.message = error.message || 'Failed to make request';
      apiError.code = 'REQUEST_ERROR';
    }

    return apiError;
  }

  /**
   * Get default error message based on status code
   */
  getDefaultErrorMessage(status) {
    const messages = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'Conflict. The resource already exists.',
      422: 'Validation failed. Please check your input.',
      500: 'Server error. Please try again later.',
      503: 'Service temporarily unavailable. Please try again later.',
    };

    return messages[status] || 'An error occurred. Please try again.';
  }

  /**
   * HTTP Methods
   */
  async get(url, config = {}) {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post(url, data = {}, config = {}) {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put(url, data = {}, config = {}) {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch(url, data = {}, config = {}) {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete(url, config = {}) {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;