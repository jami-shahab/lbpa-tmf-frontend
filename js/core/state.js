/**
 * State Management
 * Single Responsibility: Manage application state and notify subscribers of changes
 * Observer Pattern: Allows views to subscribe to state changes
 */

class StateManager {
  constructor(initialState = {}) {
    this.state = initialState;
    this.subscribers = new Set();
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    const previousState = this.getState();
    this.state = { ...this.state, ...updates };
    this.notifySubscribers(previousState, this.state);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(previousState, currentState) {
    this.subscribers.forEach(callback => {
      callback(currentState, previousState);
    });
  }

  reset() {
    this.state = {};
    this.notifySubscribers({}, {});
  }
}

// Global state instance
const state = new StateManager({
  currentView: 'public',
  isAdmin: false,
  selectedIncidentIds: [],
  filters: {},
  isOnline: true,
});

export default state;
