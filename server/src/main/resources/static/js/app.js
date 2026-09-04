/* ==========================================================================
   NOVA BANK - MAIN APPLICATION ROUTER & UI ORCHESTRATOR
   ========================================================================== */

const AppRouter = {
  views: ['login-view', 'signup-view', 'dashboard-view'],

  init() {
    window.addEventListener('hashchange', () => this.route());
    this.route();
    this.checkApiStatus();
    setInterval(() => this.checkApiStatus(), 30000); // Check API health every 30s
  },

  route() {
    if (typeof closeAllModals === 'function') closeAllModals();
    let hash = window.location.hash || '#login';
    const isAuth = API_CONFIG.isAuthenticated();

    if (!isAuth && hash === '#dashboard') {
      window.location.hash = '#login';
      return;
    }

    if (isAuth && (hash === '#login' || hash === '#signup')) {
      window.location.hash = '#dashboard';
      return;
    }

    // Hide all views
    this.views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.style.display = 'none';
    });

    // Show appropriate view
    const navUserArea = document.getElementById('nav-user-area');
    if (hash === '#signup') {
      const signupEl = document.getElementById('signup-view');
      if (signupEl) signupEl.style.display = 'block';
      if (navUserArea) navUserArea.style.display = 'none';
    } else if (hash === '#dashboard') {
      const dashEl = document.getElementById('dashboard-view');
      if (dashEl) dashEl.style.display = 'block';
      if (navUserArea) navUserArea.style.display = 'flex';
      loadDashboard();
    } else {
      const loginEl = document.getElementById('login-view');
      if (loginEl) loginEl.style.display = 'block';
      if (navUserArea) navUserArea.style.display = 'none';
    }
  },

  async checkApiStatus() {
    const badge = document.getElementById('api-status-badge');
    const label = document.getElementById('api-status-label');
    try {
      await BankAPI.checkHealth();
      badge.style.borderColor = 'var(--emerald)';
      badge.style.color = 'var(--emerald)';
      badge.querySelector('.status-dot').style.background = 'var(--emerald)';
      label.innerText = API_CONFIG.getBaseUrl().includes('onrender') ? 'Live Render API' : 'Local API';
    } catch (e) {
      badge.style.borderColor = 'var(--amber)';
      badge.style.color = 'var(--amber)';
      badge.querySelector('.status-dot').style.background = 'var(--amber)';
      label.innerText = 'Connecting...';
    }
  }
};

/**
 * Handle Logout
 */
function handleLogout() {
  API_CONFIG.clearToken();
  if (typeof currentAccountData !== 'undefined') currentAccountData = null;
  if (typeof allTransactions !== 'undefined') allTransactions = [];
  if (typeof closeAllModals === 'function') closeAllModals();
  showToast('Logged out successfully', 'info');
  window.location.hash = '#login';
  AppRouter.route();
}

window.handleLogout = handleLogout;
window.AppRouter = AppRouter;

/**
 * Open API Settings Switcher Modal
 */
function openApiSwitcher() {
  const currentUrl = API_CONFIG.getBaseUrl();
  document.getElementById('api-url-input').value = currentUrl;
  openModal('api-settings-modal');
}

/**
 * Save Custom API Base URL
 */
function saveApiBaseUrl() {
  const newUrl = document.getElementById('api-url-input').value.trim();
  if (newUrl) {
    API_CONFIG.setBaseUrl(newUrl);
    showToast(`API URL set to: ${newUrl}`, 'success');
    closeModal('api-settings-modal');
    AppRouter.checkApiStatus();
    if (API_CONFIG.isAuthenticated()) {
      loadDashboard();
    }
  }
}

function setQuickApiUrl(type) {
  const input = document.getElementById('api-url-input');
  if (type === 'RENDER') {
    input.value = API_CONFIG.DEFAULT_BASE_URL;
  } else {
    input.value = API_CONFIG.LOCAL_BASE_URL;
  }
}

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  AppRouter.init();
});
