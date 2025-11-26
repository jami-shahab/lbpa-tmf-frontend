/**
 * API Client - Abstraction Layer for Backend Communication
 * Single Responsibility: Handle all HTTP communication with backend
 * Dependency Inversion: Views depend on this abstraction, not direct fetch calls
 */

import CONFIG from './config.js';

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.isOnline = true;
  }

  /**
   * Generic request handler with error handling and offline detection
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add admin auth token for admin endpoints
    if (endpoint.startsWith('/admin')) {
      defaultOptions.headers['Authorization'] = `Bearer ${CONFIG.ADMIN_AUTH_TOKEN}`;
    }

    // Merge headers properly
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    };

    // Remove Content-Type header if it's undefined (for FormData)
    if (mergedOptions.headers['Content-Type'] === undefined) {
      delete mergedOptions.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, mergedOptions);

      // Handle offline state
      if (!response.ok) {
        if (response.status >= 500) {
          this.isOnline = false;
          throw new Error(`Service unavailable (${response.status})`);
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      this.isOnline = true;

      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        this.isOnline = false;
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Public API Methods
  async getIncidents(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(`${key}[]`, item));
        } else {
          params.append(key, value);
        }
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(CONFIG.API_ENDPOINTS.INCIDENTS + query);
  }

  async getIncidentById(id) {
    return this.request(CONFIG.API_ENDPOINTS.INCIDENT_BY_ID(id));
  }

  async getRegions() {
    return this.request(CONFIG.API_ENDPOINTS.REGIONS);
  }

  async subscribe(subscriptionData) {
    return this.request(CONFIG.API_ENDPOINTS.SUBSCRIBE, {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  async verifySubscription(token) {
    return this.request(CONFIG.API_ENDPOINTS.VERIFY_SUBSCRIPTION(token), {
      method: 'GET',
    });
  }

  async unsubscribe(token) {
    return this.request(CONFIG.API_ENDPOINTS.UNSUBSCRIBE(token), {
      method: 'DELETE',
    });
  }

  // Admin API Methods
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(CONFIG.API_ENDPOINTS.ADMIN_UPLOADS, {
      method: 'POST',
      headers: {
        // Don't set Content-Type, let browser set it for FormData
        // Authorization will be added by request() method
        'Content-Type': undefined,
      },
      body: formData,
    });
  }

  async publishUpload(uploadId) {
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_UPLOAD_PUBLISH(uploadId), {
      method: 'PUT',
    });
  }

  async deleteUpload(uploadId) {
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_UPLOAD_DELETE(uploadId), {
      method: 'DELETE',
    });
  }

  async updateIncident(incidentId, data) {
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_INCIDENT_UPDATE(incidentId), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteIncident(incidentId) {
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_INCIDENT_DELETE(incidentId), {
      method: 'DELETE',
    });
  }

  async bulkDeleteIncidents(incidentIds) {
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_INCIDENTS_BULK, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', ids: incidentIds }),
    });
  }

  async getLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_LOGS + query);
  }

  async getHealth() {
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_HEALTH);
  }

  async triggerFetch() {
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_FETCH_TRIGGER, {
      method: 'POST',
    });
  }

  async getSettings() {
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_SETTINGS);
  }

  async updateSettings(settings) {
    return this.request(CONFIG.API_ENDPOINTS.ADMIN_SETTINGS, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  getOnlineStatus() {
    return this.isOnline;
  }
}

// Singleton instance
const api = new APIClient(CONFIG.API_BASE_URL);

export default api;
