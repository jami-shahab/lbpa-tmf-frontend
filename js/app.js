/**
 * Main Application Entry Point
 * Initializes router, registers views, and starts the application
 */

import router from './core/router.js';
import state from './core/state.js';
import api from './core/api.js';
import CONFIG from './core/config.js';
import { PublicView } from './views/PublicView.js';
import { AdminUploadView } from './views/AdminUploadView.js';
import { AdminIncidentsView } from './views/AdminIncidentsView.js';
import { AdminLogsView } from './views/AdminLogsView.js';

class App {
  constructor() {
    this.init();
  }

  init() {
    // Register routes
    router.register('/', PublicView);
    router.register('/admin/', AdminUploadView); // Default admin page
    router.register('/admin/upload', AdminUploadView);
    router.register('/admin/incidents', AdminIncidentsView);
    router.register('/admin/logs', AdminLogsView);

    // Monitor online status
    this.setupOnlineStatusMonitoring();

    // Start application
    this.start();
  }

  start() {
    // Get initial route from URL hash or default to '/'
    const initialRoute = window.location.hash.slice(1) || '/';
    router.navigate(initialRoute, false);
  }

  setupOnlineStatusMonitoring() {
    // Check API status periodically
    setInterval(async () => {
      const isOnline = api.getOnlineStatus();
      state.setState({ isOnline });

      // Show/hide offline banner
      this.toggleOfflineBanner(!isOnline);
    }, 30000); // Check every 30 seconds

    // Also listen to browser online/offline events
    window.addEventListener('online', () => {
      state.setState({ isOnline: true });
      this.toggleOfflineBanner(false);
    });

    window.addEventListener('offline', () => {
      state.setState({ isOnline: false });
      this.toggleOfflineBanner(true);
    });
  }

  toggleOfflineBanner(show) {
    let banner = document.getElementById('offline-banner');

    if (show && !banner) {
      banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.className = 'offline-banner';
      banner.setAttribute('role', 'alert');
      banner.setAttribute('aria-live', 'assertive');
      banner.textContent = '⚠️ Connection Lost - Some features may be unavailable';
      document.body.prepend(banner);
    } else if (!show && banner) {
      banner.remove();
    }
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}

export default App;
