// API service for Deal Galaxy frontend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to make HTTP requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }

  async refreshToken() {
    try {
      const response = await this.request('/auth/refresh', { method: 'POST' });
      if (response.token) {
        this.token = response.token;
        localStorage.setItem('authToken', response.token);
      }
      return response;
    } catch (error) {
      // If refresh fails, logout user
      this.logout();
      throw error;
    }
  }

  // Deals methods
  async getDeals(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/deals${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getDealById(dealId) {
    return await this.request(`/deals/${dealId}`);
  }

  async searchDeals(query, filters = {}) {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/search?${queryString}`);
  }

  // Price tracking methods
  async getTrackedProducts() {
    return await this.request('/track');
  }

  async addProductToTrack(productData) {
    return await this.request('/track', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateTrackedProduct(productId, updates) {
    return await this.request(`/track/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async removeTrackedProduct(productId) {
    return await this.request(`/track/${productId}`, {
      method: 'DELETE',
    });
  }

  async refreshProductPrices() {
    return await this.request('/track/refresh', {
      method: 'POST',
    });
  }

  // User profile methods
  async getUserProfile() {
    return await this.request('/auth/profile');
  }

  async updateUserProfile(profileData) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Search products on Amazon
  async searchAmazonProducts(query) {
    return await this.request('/search/amazon', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // Get product details by URL
  async getProductByUrl(url) {
    return await this.request('/search/product', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  // Analytics and stats
  async getUserStats() {
    return await this.request('/auth/stats');
  }

  async getAppStats() {
    return await this.request('/stats');
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  getStoredUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
  login,
  register,
  logout,
  refreshToken,
  getDeals,
  getDealById,
  searchDeals,
  getTrackedProducts,
  addProductToTrack,
  updateTrackedProduct,
  removeTrackedProduct,
  refreshProductPrices,
  getUserProfile,
  updateUserProfile,
  searchAmazonProducts,
  getProductByUrl,
  getUserStats,
  getAppStats,
  isAuthenticated,
  getStoredUser,
} = apiService;

