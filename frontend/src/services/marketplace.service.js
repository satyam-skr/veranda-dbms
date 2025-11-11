import { apiClient } from '@/lib/apiClient';
import { API_CONFIG } from '@/config/api.config';

/**
 * Marketplace Service
 * Handles all marketplace-related API calls
 */

export const marketplaceService = {
  /**
   * Get all marketplace listings
   * @param {Object} filters - { status, search, page, limit }
   * @returns {Promise<Object>} Listings data with pagination
   */
  async getListings(filters = {}) {
    try {
      // Construct the URL with query parameters
      const baseUrl = '/marketplace/listings';
      const params = new URLSearchParams();
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.page) {
        params.append('page', filters.page);
      }
      if (filters.limit) {
        params.append('limit', filters.limit);
      }

      const queryString = params.toString();
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  },

  /**
   * Get listing by ID
   * @param {string} id - Listing ID
   * @returns {Promise<Object>} Listing details
   */
  async getListingById(id) {
    try {
      const response = await apiClient.get(`/marketplace/listings/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  },

  /**
   * Create new listing
   * @param {Object} listingData - Listing data with file upload
   * @returns {Promise<Object>} Created listing
   */
  async createListing(listingData) {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields
      if (listingData.title) formData.append('title', listingData.title);
      if (listingData.item_description) formData.append('item_description', listingData.item_description);
      if (listingData.price) formData.append('price', listingData.price.toString());
      if (listingData.condition) formData.append('condition', listingData.condition);
      if (listingData.seller_id) formData.append('seller_id', listingData.seller_id);
      
      // Add image file if provided
      if (listingData.image) {
        formData.append('image', listingData.image);
      }

      // Post to backend
      const response = await apiClient.post(
        '/marketplace/listings',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  },

  /**
   * Update listing
   * @param {string} id - Listing ID
   * @param {Object} listingData - Updated listing data
   * @returns {Promise<Object>} Updated listing
   */
  async updateListing(id, listingData) {
    try {
      const response = await apiClient.put(
        `/marketplace/listings/${id}`,
        listingData
      );
      return response;
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  },

  /**
   * Delete listing
   * @param {string} id - Listing ID
   * @returns {Promise<void>}
   */
  async deleteListing(id) {
    try {
      const response = await apiClient.delete(`/marketplace/listings/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },

  /**
   * Search listings
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Search results
   */
  async searchListings(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (filters.status) params.append('status', filters.status);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);

      const response = await apiClient.get(
        `/marketplace/search?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error searching listings:', error);
      throw error;
    }
  },

  /**
   * Get my listings (seller) - requires authentication
   * @returns {Promise<Array>} List of user's listings
   */
  async getMyListings() {
    try {
      const response = await apiClient.get('/marketplace/my-listings');
      return response;
    } catch (error) {
      console.error('Error fetching my listings:', error);
      throw error;
    }
  },
};
