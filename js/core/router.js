/**
 * Router - Client-side routing
 * Single Responsibility: Handle navigation and route management
 */

import state from './state.js';

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.currentView = null;

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.navigate(window.location.hash.slice(1) || '/', false);
    });
  }

  register(path, viewClass) {
    this.routes.set(path, viewClass);
  }

  async navigate(path, pushState = true) {
    // Destroy current view
    if (this.currentView && typeof this.currentView.destroy === 'function') {
      this.currentView.destroy();
    }

    const ViewClass = this.routes.get(path);

    if (!ViewClass) {
      console.error(`No route registered for path: ${path}`);
      return;
    }

    // Update browser history
    if (pushState) {
      window.history.pushState({}, '', `#${path}`);
    }

    // Create and render new view
    this.currentRoute = path;
    this.currentView = new ViewClass();

    if (typeof this.currentView.render === 'function') {
      await this.currentView.render();
    }

    // Update state
    state.setState({ currentView: path });
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

// Singleton instance
const router = new Router();

export default router;
