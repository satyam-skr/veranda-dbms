/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  enableLogging: import.meta.env.VITE_ENABLE_API_LOGGING === 'true',
  
  // API Endpoints
  endpoints: {
    // Auth endpoints
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      profile: '/auth/profile',
    },
    
    // Marketplace endpoints
    marketplace: {
      listings: '/marketplace/listings',
      listingDetail: (id) => `/marketplace/listings/${id}`,
      createListing: '/marketplace/listings',
      updateListing: (id) => `/marketplace/listings/${id}`,
      deleteListing: (id) => `/marketplace/listings/${id}`,
      myListings: '/marketplace/my-listings',
      searchListings: '/marketplace/search',
    },
    
    // User endpoints
    users: {
      profile: '/users/profile',
      update: '/users/profile',
      stats: '/users/stats',
      notifications: '/users/notifications',
    },
  },
  
  // HTTP Status codes
  statusCodes: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
};