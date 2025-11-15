/**
 * Admin Incidents View - Manage All Incidents
 * Single Responsibility: Display and manage all incidents
 */

import CONFIG from '../core/config.js';
import api from '../core/api.js';
import { $, $$, clearElement } from '../core/dom.js';
import { ConfirmModal } from '../components/Modal.js';
import state from '../core/state.js';

export class AdminIncidentsView {
  constructor() {
    this.confirmModal = new ConfirmModal();
    this.incidents = [];
    this.filters = {};
    this.selectedIds = [];
    this.regions = [];
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  formatTypeLabel(type) {
    if (!type) return 'N/A';
    const typeConfig = CONFIG.INCIDENT_TYPES.find(t => t.value === type);
    return typeConfig ? typeConfig.label : type;
  }

  async render() {
    const app = $('#app');
    if (!app) return;

    app.innerHTML = this.getHTML();
    await this.loadRegions();
    await this.loadIncidents();
    this.bindEvents();
  }

  async loadRegions() {
    try {
      const response = await api.getRegions();
      if (response.success && response.data) {
        this.regions = response.data;
        this.updateRegionDropdown();
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
      this.regions = [];
    }
  }

  updateRegionDropdown() {
    const regionSelect = $('#filter-region');
    if (!regionSelect) return;

    const currentValue = regionSelect.value;
    regionSelect.innerHTML = `
      <option value="">All Regions</option>
      ${this.regions.map(region => `
        <option value="${region}">${region}</option>
      `).join('')}
    `;
    regionSelect.value = currentValue;
  }

  getHTML() {
    const { grayText, grayBg, red } = CONFIG.COLORS;

    return `
      <div class="min-h-screen flex flex-col">
        ${this.getAdminHeaderHTML()}
        <main class="flex-1 px-4 sm:px-6 py-6 sm:py-8">
          <div class="max-w-[1200px] mx-auto">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h1 class="mb-2 text-xl sm:text-2xl font-bold" style="color:${grayText}">All Incidents</h1>
                <p class="text-sm sm:text-base" style="color:${grayText};opacity:.7">
                  Manage all traffic and transit incidents across all sources
                </p>
              </div>
            </div>

            <div id="incidents-message" class="hidden mb-4"></div>

            ${this.getFiltersHTML()}

            <div id="bulk-actions" class="hidden mb-4 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2" style="background-color:rgba(58,118,146,0.1)">
              <span class="text-sm sm:text-base" style="color:${grayText}">
                <span id="selected-count">0</span> incident(s) selected
              </span>
              <button id="bulk-delete-btn" class="px-4 py-2 rounded text-white text-sm" style="background-color:${red}">
                Delete Selected
              </button>
            </div>

            <div class="rounded-lg border overflow-hidden mb-6">
              <div id="incidents-container" class="overflow-x-auto">
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
            <a href="#/admin/incidents" class="hover:underline text-sm sm:text-base whitespace-nowrap font-semibold transition-colors" style="color:${lbpaGreen}">All Incidents</a>
            <a href="#/admin/logs" class="hover:underline text-sm sm:text-base whitespace-nowrap transition-colors" style="color:${black}">Logs & Health</a>
            <a href="#/" class="hover:underline text-sm sm:text-base whitespace-nowrap transition-colors" style="color:${black}">Public View</a>
          </nav>
        </div>
      </header>
    `;
  }

  getFiltersHTML() {
    const { grayText } = CONFIG.COLORS;

    return `
      <div class="flex flex-wrap gap-3 p-4 mb-6 rounded-lg filter-panel">
        <div class="flex-1 min-w-[140px] sm:min-w-[180px]">
          <label class="block text-xs sm:text-sm mb-1" style="color:${grayText}">Type</label>
          <select id="filter-type" class="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded border bg-white" style="color:${grayText}">
            <option value="">All Types</option>
            ${CONFIG.INCIDENT_TYPES.map(type => `
              <option value="${type.value}">${type.label}</option>
            `).join('')}
          </select>
        </div>

        <div class="flex-1 min-w-[140px] sm:min-w-[180px]">
          <label class="block text-xs sm:text-sm mb-1" style="color:${grayText}">Region</label>
          <select id="filter-region" class="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded border bg-white" style="color:${grayText}">
            <option value="">All Regions</option>
          </select>
        </div>

        <div class="flex items-end w-full sm:w-auto">
          <button id="reset-filters" class="px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded border bg-white hover:bg-gray-50 w-full sm:w-auto" style="color:${grayText}">
            Reset Filters
          </button>
        </div>
      </div>
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

  async loadIncidents() {
    try {
      // Remove status filter - admin should see all
      const adminFilters = { ...this.filters };
      delete adminFilters.status;

      const response = await api.getIncidents(adminFilters);

      if (response.success && response.data) {
        this.incidents = response.data.items || [];
        this.renderTable();
      }
    } catch (error) {
      this.showMessage(`Error loading incidents: ${error.message}`, 'error');
    }
  }

  renderTable() {
    const container = $('#incidents-container');
    if (!container) return;

    if (this.incidents.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-500">
          No incidents found.
        </div>
      `;
      return;
    }

    const { grayText, grayBg, blue, red } = CONFIG.COLORS;

    container.innerHTML = `
      <table class="w-full min-w-[900px]">
        <thead style="background-color:${grayBg}">
          <tr>
            <th class="px-4 py-3 text-left">
              <input id="select-all" type="checkbox" class="w-4 h-4" aria-label="Select all incidents" />
            </th>
            <th class="px-4 py-3 text-left" style="color:${grayText}">Location</th>
            <th class="px-4 py-3 text-left" style="color:${grayText}">Type</th>
            <th class="px-4 py-3 text-left" style="color:${grayText}">Impact</th>
            <th class="px-4 py-3 text-left" style="color:${grayText}">Start Date</th>
            <th class="px-4 py-3 text-left" style="color:${grayText}">Status</th>
            <th class="px-4 py-3 text-left" style="color:${grayText}">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.incidents.map((incident, idx) => `
            <tr class="border-t hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}">
              <td class="px-4 py-3">
                <input type="checkbox" class="row-select w-4 h-4" value="${incident.id}" aria-label="Select incident" />
              </td>
              <td class="px-4 py-3" style="color:${grayText}">${this.escapeHTML(incident.title || 'N/A')}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-sm type-${(incident.type || '').toLowerCase()}" style="color:${grayText}">
                  ${this.escapeHTML(this.formatTypeLabel(incident.type))}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-sm impact-${(incident.impact || 'low').toLowerCase()}" style="color:${grayText}">
                  ${this.escapeHTML(incident.impact || 'N/A')}
                </span>
              </td>
              <td class="px-4 py-3" style="color:${grayText}">${this.formatDate(incident.start_date)}</td>
              <td class="px-4 py-3">
                <span class="status-badge status-${(incident.status || 'draft').toLowerCase()}">
                  ${this.escapeHTML((incident.status || 'draft').charAt(0).toUpperCase() + (incident.status || 'draft').slice(1))}
                </span>
              </td>
              <td class="px-4 py-3">
                <button class="delete-btn p-1 hover:bg-gray-200 rounded" data-id="${incident.id}" style="color:${red}" aria-label="Delete incident">
                  🗑️
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    this.bindTableEvents();
  }

  bindTableEvents() {
    // Select all checkbox
    $('#select-all')?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      $$('.row-select').forEach(checkbox => {
        checkbox.checked = checked;
      });
      this.updateSelectedIds();
    });

    // Individual checkboxes
    $$('.row-select').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectedIds();
      });
    });

    // Delete buttons
    $$('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.deleteIncident(id);
      });
    });
  }

  updateSelectedIds() {
    this.selectedIds = $$('.row-select:checked').map(cb => parseInt(cb.value));

    const bulkActions = $('#bulk-actions');
    const selectedCount = $('#selected-count');

    if (this.selectedIds.length > 0) {
      bulkActions?.classList.remove('hidden');
      if (selectedCount) {
        selectedCount.textContent = this.selectedIds.length.toString();
      }
    } else {
      bulkActions?.classList.add('hidden');
    }

    // Update select-all checkbox state
    const selectAll = $('#select-all');
    if (selectAll) {
      selectAll.checked = this.selectedIds.length === this.incidents.length && this.incidents.length > 0;
    }
  }

  deleteIncident(id) {
    this.confirmModal.confirm(
      'Are you sure you want to delete this incident? This action cannot be undone.',
      async () => {
        try {
          await api.deleteIncident(id);
          this.showMessage('Incident deleted successfully', 'success');
          await this.loadIncidents();
        } catch (error) {
          this.showMessage(`Delete error: ${error.message}`, 'error');
        }
      }
    );
  }

  bulkDelete() {
    if (this.selectedIds.length === 0) return;

    this.confirmModal.confirm(
      `Delete ${this.selectedIds.length} incident(s)? This action cannot be undone.`,
      async () => {
        try {
          // Delete one by one (no bulk endpoint in the current API)
          for (const id of this.selectedIds) {
            await api.deleteIncident(id);
          }

          this.showMessage(`Successfully deleted ${this.selectedIds.length} incidents`, 'success');
          this.selectedIds = [];
          await this.loadIncidents();
        } catch (error) {
          this.showMessage(`Bulk delete error: ${error.message}`, 'error');
        }
      }
    );
  }

  bindEvents() {
    // Filter events
    $('#filter-type')?.addEventListener('change', (e) => {
      this.filters.type = e.target.value;
      this.loadIncidents();
    });

    $('#filter-region')?.addEventListener('change', (e) => {
      this.filters.district = e.target.value;
      this.loadIncidents();
    });

    $('#reset-filters')?.addEventListener('click', () => {
      this.filters = {};
      $('#filter-type').value = '';
      $('#filter-region').value = '';
      this.loadIncidents();
    });

    // Bulk delete
    $('#bulk-delete-btn')?.addEventListener('click', () => {
      this.bulkDelete();
    });
  }

  showMessage(message, type = 'info') {
    const messageEl = $('#incidents-message');
    if (!messageEl) return;

    const className = type === 'error' ? 'error-message' : type === 'success' ? 'success-message' : 'text-gray-700 bg-blue-50 p-4 rounded-lg';

    messageEl.className = className;
    messageEl.textContent = message;
    messageEl.classList.remove('hidden');

    if (type === 'success') {
      setTimeout(() => {
        messageEl.classList.add('hidden');
      }, 5000);
    }
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    // Cleanup if needed
  }
}

export default AdminIncidentsView;
