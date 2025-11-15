/**
 * Admin Logs View - System Health and Logs
 * Single Responsibility: Display system health status and activity logs
 */

import CONFIG from '../core/config.js';
import api from '../core/api.js';
import { $, $$ } from '../core/dom.js';

export class AdminLogsView {
  constructor() {
    this.logs = [];
    this.health = null;
    this.autoRefresh = false;
    this.refreshInterval = null;
  }

  async render() {
    const app = $('#app');
    if (!app) return;

    app.innerHTML = this.getHTML();
    await this.loadData();
    this.bindEvents();
  }

  getHTML() {
    const { grayText, grayBg } = CONFIG.COLORS;

    return `
      <div class="min-h-screen flex flex-col">
        ${this.getAdminHeaderHTML()}
        <main class="flex-1 px-6 py-8">
          <div class="max-w-[1200px] mx-auto">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h1 class="mb-2 text-xl sm:text-2xl font-bold" style="color:${grayText}">System Health & Logs</h1>
                <p class="text-sm sm:text-base" style="color:${grayText};opacity:.7">Monitor system status and activity</p>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="auto-refresh" class="w-4 h-4" />
                  <span class="text-sm" style="color:${grayText}">Auto-refresh (60s)</span>
                </label>
                <button id="refresh-now" class="p-2 rounded-lg hover:bg-gray-100" title="Refresh now" style="color:${grayText}" aria-label="Refresh now">
                  ⟳
                </button>
              </div>
            </div>

            <div id="health-container" class="mb-8">
              <div class="flex items-center justify-center p-8">
                <div class="spinner"></div>
              </div>
            </div>

            <div class="border rounded-lg p-6" style="border-color:${grayBg}">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold" style="color:${grayText}">Activity Log</h2>
                <div class="flex gap-2">
                  ${['All', 'Errors', 'Warnings', 'Info'].map(f => `
                    <button class="log-filter px-3 py-1 rounded text-sm border hover:bg-gray-50" data-level="${f.toLowerCase()}" style="color:${grayText}">
                      ${f}
                    </button>
                  `).join('')}
                </div>
              </div>
              <div id="logs-container">
                <div class="flex items-center justify-center p-8">
                  <div class="spinner"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        ${this.getFooterHTML()}
      </div>
    `;
  }

  getAdminHeaderHTML() {
    const { black, lbpaGreen } = CONFIG.COLORS;

    return `
      <header class="sticky top-0 z-50 min-h-[72px] flex items-center px-4 sm:px-6 py-3 sm:py-0" style="background-color:rgba(255,255,255,0.95); backdrop-filter:blur(10px); box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div class="w-full max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div class="flex items-center gap-2 sm:gap-3">
            <h1 class="text-lg sm:text-xl font-bold" style="color:${black}">Leaside Business Park</h1>
            <span class="font-semibold text-sm sm:text-base" style="color:${black}">- Admin Portal</span>
          </div>
          <nav class="flex items-center gap-3 sm:gap-6 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <a href="#/admin/upload" class="hover:underline text-sm sm:text-base whitespace-nowrap transition-colors" style="color:${black}">Upload Reports</a>
            <a href="#/admin/incidents" class="hover:underline text-sm sm:text-base whitespace-nowrap transition-colors" style="color:${black}">All Incidents</a>
            <a href="#/admin/logs" class="hover:underline text-sm sm:text-base whitespace-nowrap font-semibold transition-colors" style="color:${lbpaGreen}">Logs & Health</a>
            <a href="#/" class="hover:underline text-sm sm:text-base whitespace-nowrap transition-colors" style="color:${black}">Public View</a>
          </nav>
        </div>
      </header>
    `;
  }

  getFooterHTML() {
    const { grayText, grayBg } = CONFIG.COLORS;

    return `
      <footer class="mt-24 py-8 px-6 border-t" style="border-color:${grayBg}">
        <div class="max-w-[1200px] mx-auto">
          <p class="text-sm" style="color:${grayText};opacity:.7">
            LBPA Traffic Management System - Admin Portal
          </p>
        </div>
      </footer>
    `;
  }

  async loadData() {
    await Promise.all([
      this.loadHealth(),
      this.loadLogs(),
    ]);
  }

  async loadHealth() {
    try {
      const response = await api.getHealth();

      if (response.success && response.data) {
        this.health = response.data;
        this.renderHealth();
      }
    } catch (error) {
      console.error('Error loading health:', error);
      this.showHealthError(error.message);
    }
  }

  renderHealth() {
    const container = $('#health-container');
    if (!container || !this.health) return;

    const { grayText, grayBg, green, red, yellow } = CONFIG.COLORS;

    // Determine overall health
    const dbHealth = this.health.database;
    const adaptersHealth = this.health.adapters || {};

    container.innerHTML = `
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Database Health -->
        <div class="border rounded-lg p-6" style="border-color:${grayBg}">
          <div class="flex items-start justify-between mb-4">
            <h3 class="font-semibold" style="color:${grayText}">Database</h3>
            <div class="text-2xl" style="color:${dbHealth ? green : red}">
              ${dbHealth ? '●' : '■'}
            </div>
          </div>
          <div class="space-y-3">
            <div>
              <span class="block text-sm mb-1" style="color:${grayText};opacity:.7">Status</span>
              <span class="font-medium" style="color:${dbHealth ? green : red}">
                ${dbHealth ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <!-- Data Source Health -->
        ${Object.entries(adaptersHealth).map(([sourceName, status]) => `
          <div class="border rounded-lg p-6" style="border-color:${grayBg}">
            <div class="flex items-start justify-between mb-4">
              <h3 class="font-semibold" style="color:${grayText}">${this.escapeHTML(sourceName)}</h3>
              <div class="text-2xl" style="color:${this.getStatusColor(status)}">
                ${this.getStatusIcon(status)}
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <span class="block text-sm mb-1" style="color:${grayText};opacity:.7">Status</span>
                <span class="font-medium" style="color:${this.getStatusColor(status)}">
                  ${this.escapeHTML(String(status || 'unknown').charAt(0).toUpperCase() + String(status || 'unknown').slice(1))}
                </span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  showHealthError(message) {
    const container = $('#health-container');
    if (!container) return;

    container.innerHTML = `
      <div class="error-message">
        Unable to load system health: ${this.escapeHTML(message)}
      </div>
    `;
  }

  async loadLogs(levelFilter = null) {
    try {
      const filters = {};
      if (levelFilter && levelFilter !== 'all') {
        filters.level = levelFilter;
      }

      const response = await api.getLogs(filters);

      if (response.success && response.data) {
        this.logs = response.data.items || [];
        this.renderLogs();
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      this.showLogsError(error.message);
    }
  }

  renderLogs() {
    const container = $('#logs-container');
    if (!container) return;

    if (this.logs.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-500">
          No logs found.
        </div>
      `;
      return;
    }

    const { grayText } = CONFIG.COLORS;

    container.innerHTML = `
      <div class="space-y-4 max-h-[500px] overflow-y-auto">
        ${this.logs.map((log, idx) => `
          <div class="flex gap-4 p-4 rounded-lg ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}" style="border-left:4px solid ${this.getStatusColor(log.level)}">
            <div class="flex-shrink-0 w-32">
              <span class="text-sm" style="color:${grayText};opacity:.7">${log.created_at || 'N/A'}</span>
            </div>
            <div class="flex-shrink-0 w-32">
              <span class="text-sm" style="color:${grayText}">${this.escapeHTML(log.source_adapter || 'system')}</span>
            </div>
            <div class="flex-shrink-0">
              <span class="px-2 py-1 rounded text-xs ${this.getSeverityBadge(log.level)}">
                ${this.escapeHTML((log.level || 'info').toUpperCase())}
              </span>
            </div>
            <div class="flex-1">
              <span style="color:${grayText}">${this.escapeHTML(log.message || '')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  showLogsError(message) {
    const container = $('#logs-container');
    if (!container) return;

    container.innerHTML = `
      <div class="error-message">
        Unable to load logs: ${this.escapeHTML(message)}
      </div>
    `;
  }

  bindEvents() {
    // Auto-refresh toggle
    $('#auto-refresh')?.addEventListener('change', (e) => {
      this.autoRefresh = e.target.checked;

      if (this.autoRefresh) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });

    // Manual refresh
    $('#refresh-now')?.addEventListener('click', () => {
      this.loadData();
    });

    // Log level filters
    $$('.log-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        let level = e.currentTarget.dataset.level;

        // Convert plural to singular to match database values
        if (level === 'errors') level = 'error';
        if (level === 'warnings') level = 'warning';

        this.loadLogs(level);

        // Update active state
        $$('.log-filter').forEach(b => {
          b.classList.remove('bg-blue-100', 'font-semibold');
        });
        e.currentTarget.classList.add('bg-blue-100', 'font-semibold');
      });
    });
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadData();
    }, 60000); // 60 seconds
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  getStatusColor(status) {
    const colors = {
      healthy: CONFIG.COLORS.green,
      active: CONFIG.COLORS.green,
      warning: CONFIG.COLORS.yellow,
      error: CONFIG.COLORS.red,
      info: CONFIG.COLORS.blue,
    };
    return colors[status] || CONFIG.COLORS.grayText;
  }

  getStatusIcon(status) {
    const icons = {
      healthy: '●',
      active: '●',
      warning: '▲',
      error: '■',
    };
    return icons[status] || '○';
  }

  getSeverityBadge(severity) {
    const badges = {
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800',
    };
    return badges[severity] || 'bg-gray-100 text-gray-800';
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    this.stopAutoRefresh();
  }
}

export default AdminLogsView;
