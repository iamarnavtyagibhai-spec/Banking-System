/* ==========================================================================
   NOVA BANK - CENTRALIZED API CLIENT
   ========================================================================== */

const API_CONFIG = {
  // Live Render Backend by default, with Localhost fallback
  DEFAULT_BASE_URL: 'https://banking-system-8kev.onrender.com',
  LOCAL_BASE_URL: 'http://localhost:8080',
  
  getBaseUrl() {
    const saved = localStorage.getItem('nova_api_base_url');
    if (saved) return saved;
    if (window.location.origin && window.location.origin.startsWith('http')) {
      return window.location.origin;
    }
    return this.DEFAULT_BASE_URL;
  },

  setBaseUrl(url) {
    localStorage.setItem('nova_api_base_url', url);
  },

  getToken() {
    return localStorage.getItem('nova_jwt_token');
  },

  setToken(token) {
    localStorage.setItem('nova_jwt_token', token);
  },

  clearToken() {
    localStorage.removeItem('nova_jwt_token');
    localStorage.removeItem('nova_user_email');
    localStorage.removeItem('nova_user_role');
  },

  setUser(email, role = 'USER') {
    localStorage.setItem('nova_user_email', email);
    localStorage.setItem('nova_user_role', role);
  },

  getUser() {
    return {
      email: localStorage.getItem('nova_user_email') || 'User',
      role: localStorage.getItem('nova_user_role') || 'USER'
    };
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

/**
 * Universal Fetch Request Wrapper
 */
async function apiRequest(endpoint, options = {}) {
  const baseUrl = API_CONFIG.getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = API_CONFIG.getToken();
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle Rate Limiting (429) & Auth (401/403)
      if (response.status === 401 || response.status === 403) {
        if (!endpoint.startsWith('/auth/')) {
          API_CONFIG.clearToken();
          window.location.hash = '#login';
          throw new Error('Session expired. Please login again.');
        }
      }

      let errorMsg = typeof data === 'object' && data.message ? data.message : data;
      if (typeof errorMsg === 'string' && errorMsg.includes('Exception:')) {
        errorMsg = errorMsg.split('Exception:')[1].trim();
      }
      throw new Error(errorMsg || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Global API Services Object
const BankAPI = {
  // Auth Endpoints
  signup: (payload) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  verifyOtp: (payload) => apiRequest('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  resendOtp: (payload) => apiRequest('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  forgotPassword: (payload) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  verifyForgotOtp: (payload) => apiRequest('/auth/verify-forgot-otp', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  resetPassword: (payload) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  checkHealth: () => apiRequest('/auth/health', { method: 'GET', skipAuth: true }),

  // Account Endpoints (Protected)
  getMyAccount: () => apiRequest('/account/me', { method: 'GET' }),
  getHistory: () => apiRequest('/account/history', { method: 'GET' }),
  transfer: (payload) => apiRequest('/account/transfer', { method: 'POST', body: JSON.stringify(payload) }),

  // Admin Endpoints (Protected)
  adminDeposit: (payload) => apiRequest('/admin/deposit', { method: 'POST', body: JSON.stringify(payload) })
};
