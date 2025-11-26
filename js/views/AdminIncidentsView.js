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
    // Check for sentinel date (1970-01-01)
    if (dateString.startsWith('1970-01-01')) return 'TBD';

    try {
      const date = new Date(dateString);
      // Double check year just in case timezone shift makes it Dec 31 1969
      if (date.getFullYear() <= 1970) return 'TBD';

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
    this.bindEvents();
    await this.loadRegions();
    await this.loadIncidents();
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
    const { grayText, grayBg, blue } = CONFIG.COLORS;

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

            <div class="flex flex-wrap gap-3 p-4 mb-6 rounded-lg filter-panel border border-gray-200 bg-gray-50">
              <div class="flex-1 min-w-[180px]">
                <label class="block text-sm mb-1" style="color:${grayText}">Type</label>
                <select id="filter-type" class="w-full px-3 py-2 rounded border bg-white" style="color:${grayText}">
                  <option value="">All Types</option>
                  ${CONFIG.INCIDENT_TYPES.map(type => `
                    <option value="${type.value}">${type.label}</option>
                  `).join('')}
                </select>
              </div>

              <div class="flex-1 min-w-[250px]">
                <label class="block text-sm mb-1" style="color:${grayText}">Regions</label>
                <div class="custom-dropdown bg-white" id="region-dropdown">
                  <div class="dropdown-trigger" id="region-trigger"
                       tabindex="0" role="button" aria-haspopup="true" aria-expanded="false" aria-label="Select Regions">
                    <span id="region-trigger-text">Select Regions</span>
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div class="dropdown-menu" id="region-menu" role="menu">
                    <!-- Checkboxes injected here -->
                    <div class="p-2 text-sm text-gray-400">Loading...</div>
                  </div>
                </div>
              </div>

              <div class="flex-1 min-w-[180px]">
                <label class="block text-sm mb-1" style="color:${grayText}">Impact</label>
                <select id="filter-impact" class="w-full px-3 py-2 rounded border bg-white" style="color:${grayText}">
                  <option value="">All Impact Levels</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div class="flex-1 min-w-[150px]">
                <label class="block text-sm mb-1" style="color:${grayText}">From</label>
                <input type="date" id="filter-date-from" class="w-full px-3 py-2 rounded border bg-white" style="color:${grayText}">
              </div>

              <div class="flex-1 min-w-[150px]">
                <label class="block text-sm mb-1" style="color:${grayText}">To</label>
                <input type="date" id="filter-date-to" class="w-full px-3 py-2 rounded border bg-white" style="color:${grayText}">
              </div>

              <!-- Search Bar -->
              <div class="flex-1 min-w-[200px] relative">
                <label class="block text-sm mb-1" style="color:${grayText}">Search</label>
                <input type="text" id="admin-search" placeholder="Search incidents..." 
                  class="pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  value="${this.filters.q || ''}" />
                <span class="absolute left-2.5 top-[34px] text-gray-400">🔍</span>
              </div>

              <div class="flex items-end w-full sm:w-auto">
                <button id="reset-filters" class="px-4 py-2 rounded border bg-white hover:bg-gray-50 w-full sm:w-auto" style="color:${grayText}">
                  Reset Filters
                </button>
              </div>
            </div>

            <div id="bulk-actions" class="hidden mb-4 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2" style="background-color:rgba(58,118,146,0.1)">
              <span class="text-sm sm:text-base" style="color:${grayText}">
                <span id="selected-count">0</span> incident(s) selected
              </span>
              <button id="bulk-delete-btn" class="px-4 py-2 rounded text-white text-sm" style="background-color:${CONFIG.COLORS.red}">
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

    const { grayText, grayBg } = CONFIG.COLORS;

    container.innerHTML = `
      <table class="w-full min-w-[900px]" id="incidents-table">
        <thead style="background-color:${grayBg}">
          <tr>
            <th class="px-3 py-2 text-left w-10">
              <input id="select-all" type="checkbox" class="w-4 h-4" />
            </th>
            <th class="px-3 py-2 text-left text-sm w-1/3" style="color:${grayText}">Incident Details</th>
            <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Type & Source</th>
            <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Region</th>
            <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Timing</th>
            <th class="px-1 py-2 text-center text-sm w-10" style="color:${grayText}"></th>
          </tr>
        </thead>
        <tbody id="incidents-table-body">
          ${this.renderTableBody()}
        </tbody>
      </table>
    `;

    this.bindDynamicEvents();
  }

  renderTableBody() {
    return this.incidents.map((incident, idx) => {
      if (this.editingIncidentId === incident.id) {
        return this.renderEditRow(incident);
      }
      return this.renderRow(incident, idx);
    }).join('');
  }

  renderRow(incident, idx) {
    const { grayText, lbpaGreen, red } = CONFIG.COLORS;
    const isEven = idx % 2 === 0;
    const isSelected = this.selectedIds.includes(incident.id);

    return `
      <tr class="border-t ${isEven ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors">
        <td class="px-3 py-2 align-top pt-3">
          <input type="checkbox" class="row-select w-4 h-4" value="${incident.id}" ${isSelected ? 'checked' : ''} />
        </td>
        <td class="px-3 py-2 text-sm" style="color:${grayText}">
          <div class="font-bold mb-1">${this.escapeHTML(incident.title || 'N/A')}</div>
          ${(incident.location && incident.location !== incident.title) ?
        `<div class="text-xs text-gray-600 mb-1">📍 ${this.escapeHTML(incident.location)}</div>` : ''}
          <div class="text-xs opacity-75 line-clamp-2">${this.escapeHTML(incident.description || '')}</div>
        </td>
        <td class="px-3 py-2 text-sm" style="color:${grayText}">
          <div class="font-medium">${this.escapeHTML(this.formatTypeLabel(incident.type))}</div>
          <div class="text-xs opacity-75 mt-1">
            Source: ${this.escapeHTML(incident.source || 'Metrolinx')}
            ${incident.external_link ? ` <a href="${incident.external_link}" target="_blank" class="text-blue-600 hover:underline" title="View Source">📄</a>` : ''}
          </div>
          <div class="text-xs opacity-75">Impact: ${this.escapeHTML(incident.impact || 'N/A')}</div>
        </td>
        <td class="px-3 py-2 text-sm" style="color:${grayText}">
          <span class="inline-block px-2 py-0.5 rounded text-xs bg-gray-200">
            ${this.escapeHTML(incident.district || 'N/A')}
          </span>
        </td>
        <td class="px-3 py-2 text-sm" style="color:${grayText}">
          <div class="whitespace-nowrap">Start: ${this.formatDate(incident.start_date)}</div>
          <div class="whitespace-nowrap opacity-75">End: ${this.formatDate(incident.end_date)}</div>
        </td>
        <td class="px-1 py-2 text-center text-sm whitespace-nowrap align-middle">
          <div class="flex flex-col gap-1 items-center justify-center">
            <button class="edit-btn p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors" data-id="${incident.id}" title="Edit">
              ✏️
            </button>
            <button class="delete-btn p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors" data-id="${incident.id}" title="Delete">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  renderEditRow(incident) {
    const { grayText, green, grayBg } = CONFIG.COLORS;

    // Helper to format date for input (YYYY-MM-DD)
    const toInputDate = (dateStr) => {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toISOString().split('T')[0];
      } catch { return ''; }
    };

    return `
      <tr class="bg-yellow-50 border-t border-b border-yellow-200">
        <td colspan="6" class="p-4">
          <form class="edit-form grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-id="${incident.id}">
            <div class="col-span-1 sm:col-span-2 lg:col-span-3">
              <label class="block text-xs font-bold mb-1" style="color:${grayText}">Title</label>
              <input type="text" name="title" value="${this.escapeHTML(incident.title || '')}" class="w-full text-sm border rounded p-1" required />
            </div>
            
            <div class="col-span-1 sm:col-span-2 lg:col-span-3">
              <label class="block text-xs font-bold mb-1" style="color:${grayText}">Description</label>
              <textarea name="description" rows="3" class="w-full text-sm border rounded p-1">${this.escapeHTML(incident.description || '')}</textarea>
            </div>

            <div class="col-span-1 sm:col-span-2">
              <label class="block text-xs font-bold mb-1" style="color:${grayText}">Location</label>
              <input type="text" name="location" value="${this.escapeHTML(incident.location || '')}" class="w-full text-sm border rounded p-1" />
            </div>

            <div>
              <label class="block text-xs font-bold mb-1" style="color:${grayText}">Region</label>
              <select name="district" class="w-full text-sm border rounded p-1">
                <option value="">Select Region...</option>
                <option value="Leaside-Thorncliffe" ${incident.district === 'Leaside-Thorncliffe' ? 'selected' : ''}>Leaside-Thorncliffe</option>
                <option value="East York" ${incident.district === 'East York' ? 'selected' : ''}>East York</option>
                <option value="Scarborough" ${incident.district === 'Scarborough' ? 'selected' : ''}>Scarborough</option>
                <option value="North York" ${incident.district === 'North York' ? 'selected' : ''}>North York</option>
                <option value="Etobicoke" ${incident.district === 'Etobicoke' ? 'selected' : ''}>Etobicoke</option>
                <option value="Toronto" ${incident.district === 'Toronto' ? 'selected' : ''}>Toronto</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold mb-1" style="color:${grayText}">Type</label>
              <select name="type" class="w-full text-sm border rounded p-1">
                ${CONFIG.INCIDENT_TYPES.map(t => `
                  <option value="${t.value}" ${incident.type === t.value ? 'selected' : ''}>${t.label}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold mb-1" style="color:${grayText}">Impact</label>
              <select name="impact" class="w-full text-sm border rounded p-1">
                <option value="low" ${incident.impact === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${incident.impact === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${incident.impact === 'high' ? 'selected' : ''}>High</option>
                <option value="critical" ${incident.impact === 'critical' ? 'selected' : ''}>Critical</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold mb-1" style="color:${grayText}">Source</label>
              <select name="source" class="w-full text-sm border rounded p-1">
                ${CONFIG.SOURCE_TYPES.map(s => `
                  <option value="${s.value}" ${incident.source === s.value ? 'selected' : ''}>${s.label}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold mb-1" style="color:${grayText}">Start Date</label>
              <input type="date" name="start_date" value="${toInputDate(incident.start_date)}" class="w-full text-sm border rounded p-1" required />
            </div>

            <div>
              <label class="block text-xs font-bold mb-1" style="color:${grayText}">End Date</label>
              <input type="date" name="end_date" value="${toInputDate(incident.end_date)}" class="w-full text-sm border rounded p-1" />
            </div>

            <div class="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-2">
              <button type="button" class="cancel-btn px-3 py-1 rounded text-sm border bg-white hover:bg-gray-50" data-id="${incident.id}">
                Cancel
              </button>
              <button type="submit" class="save-btn px-4 py-1 rounded text-sm text-white" style="background-color:${green}">
                💾 Save Changes
              </button>
            </div>
          </form>
        </td>
      </tr>
    `;
  }

  bindDynamicEvents() {
    const tableBody = $('#incidents-table-body');
    if (!tableBody) return;

    // Select All
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

    // Edit button
    tableBody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.toggleEditMode(id);
      });
    });

    // Delete button
    tableBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.deleteIncident(id);
      });
    });

    // Cancel button
    tableBody.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleEditMode(null);
      });
    });

    // Save form
    tableBody.querySelectorAll('.edit-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(e.currentTarget.dataset.id);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        this.saveIncident(id, data);
      });
    });
  }

  toggleEditMode(id) {
    this.editingIncidentId = id;
    const tableBody = $('#incidents-table-body');
    if (tableBody) {
      tableBody.innerHTML = this.renderTableBody();
      this.bindDynamicEvents();
    }
  }

  async saveIncident(id, data) {
    try {
      this.showMessage('Saving changes...', 'info');
      const response = await api.updateIncident(id, data);

      if (response.success) {
        this.showMessage('Incident updated successfully', 'success');
        this.toggleEditMode(null);
        await this.loadIncidents(); // Reload to get fresh data
      }
    } catch (error) {
      this.showMessage(`Update error: ${error.message}`, 'error');
    }
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

    $('#filter-impact')?.addEventListener('change', (e) => {
      this.filters.impact = e.target.value;
      this.loadIncidents();
    });

    $('#filter-date-from')?.addEventListener('change', (e) => {
      this.filters.start_date_from = e.target.value;
      this.loadIncidents();
    });

    $('#filter-date-to')?.addEventListener('change', (e) => {
      this.filters.end_date_to = e.target.value;
      this.loadIncidents();
    });

    // Region Dropdown Toggle
    const regionTrigger = $('#region-trigger');
    const regionMenu = $('#region-menu');

    regionTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      $('#region-dropdown').classList.toggle('active');
      const isExpanded = $('#region-dropdown').classList.contains('active');
      regionTrigger.setAttribute('aria-expanded', isExpanded);
    });

    // Keyboard accessibility
    regionTrigger?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $('#region-dropdown').classList.toggle('active');
        const isExpanded = $('#region-dropdown').classList.contains('active');
        regionTrigger.setAttribute('aria-expanded', isExpanded);
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!$('#region-dropdown')?.contains(e.target)) {
        $('#region-dropdown')?.classList.remove('active');
      }
    });

    // Search input with debounce
    let searchTimeout;
    $('#admin-search')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.q = e.target.value;
        this.loadIncidents();
      }, 300);
    });

    $('#reset-filters')?.addEventListener('click', () => {
      this.filters = {};
      $('#filter-type').value = '';
      $('#filter-impact').value = '';
      $('#filter-date-from').value = '';
      $('#filter-date-to').value = '';
      $('#admin-search').value = '';
      this.updateRegionDropdown();
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
