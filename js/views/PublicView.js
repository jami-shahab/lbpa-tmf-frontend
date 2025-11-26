/**
 * Public View - Traffic & Transit Updates
 * Single Responsibility: Display public-facing incident information
 */

import CONFIG from '../core/config.js';
import api from '../core/api.js';
import { $, $$, clearElement } from '../core/dom.js';
import { Modal } from '../components/Modal.js';
import { SubscribeForm } from '../components/SubscribeForm.js';

export class PublicView {
  constructor() {
    this.incidents = [];
    this.filters = {
      district: ['Leaside-Thorncliffe']
    };
    this.detailPanel = null;
    this.map = null;
    this.markers = [];
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

  formatSourceLabel(sourceType) {
    if (!sourceType) return 'N/A';
    const sourceConfig = CONFIG.SOURCE_TYPES.find(s => s.value === sourceType);
    return sourceConfig ? sourceConfig.label : sourceType;
  }

  async render() {
    const app = $('#app');
    if (!app) return;

    app.innerHTML = this.getHTML();

    // Set up global function for map popup buttons
    window.viewIncidentDetail = (id) => {
      this.showDetail(id);
    };

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
        this.regions = response.data;
        this.updateRegionDropdown();
        this.updateFooterRegionDropdown();
        this.updateFooterTypeDropdown();
        this.updateFooterImpactDropdown();
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
      this.regions = [];
    }
  }

  updateRegionDropdown() {
    const menu = $('#region-menu');
    const triggerText = $('#region-trigger-text');
    if (!menu || !triggerText) return;

    // Ensure Leaside-Thorncliffe is in the list if not already
    const priorityRegion = 'Leaside-Thorncliffe';
    const otherRegions = this.regions.filter(r => r !== priorityRegion).sort();

    // Current selected values (default to Leaside-Thorncliffe)
    const currentSelected = this.filters.district || [priorityRegion];

    // Update Trigger Text
    if (currentSelected.length === 0) {
      triggerText.textContent = 'All Regions';
    } else if (currentSelected.length === this.regions.length + (this.regions.includes(priorityRegion) ? 0 : 1)) {
      triggerText.textContent = 'All Regions';
    } else if (currentSelected.length === 1 && currentSelected[0] === priorityRegion) {
      triggerText.textContent = priorityRegion;
    } else if (currentSelected.length <= 2) {
      triggerText.textContent = currentSelected.join(', ');
    } else {
      triggerText.textContent = `${currentSelected.length} Regions Selected`;
    }

    // Render Checkboxes
    const isAllSelected = currentSelected.length === 0;

    let html = `
      <label class="dropdown-item">
        <input type="checkbox" 
          value="ALL" 
          class="region-checkbox-all rounded text-blue-600 focus:ring-blue-500"
          ${isAllSelected ? 'checked' : ''}
        >
        <span class="font-semibold">All Regions</span>
      </label>
      <div class="border-b my-1"></div>
      
      <!-- Priority Region -->
      <label class="dropdown-item bg-blue-50">
        <input type="checkbox" 
          value="${priorityRegion}" 
          class="region-checkbox rounded text-blue-600 focus:ring-blue-500"
          ${currentSelected.includes(priorityRegion) ? 'checked' : ''}
        >
        <span class="font-medium text-blue-800">${priorityRegion}</span>
      </label>
      <div class="border-b my-1"></div>
    `;

    html += otherRegions.map(region => `
      <label class="dropdown-item">
        <input type="checkbox" 
          value="${region}" 
          class="region-checkbox rounded text-blue-600 focus:ring-blue-500"
          ${currentSelected.includes(region) ? 'checked' : ''}
        >
        <span>${region}</span>
      </label>
    `).join('');

    menu.innerHTML = html;

    // Bind events
    // 1. "All Regions" checkbox
    const allCheckbox = menu.querySelector('.region-checkbox-all');
    allCheckbox?.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.filters.district = [];
      } else {
        // If unchecking All, default to Priority Region
        this.filters.district = [priorityRegion];
      }
      this.updateRegionDropdown();
      this.loadIncidents();
    });

    // 2. Individual checkboxes
    menu.querySelectorAll('.region-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        let selected = this.filters.district || [];
        const value = cb.value;

        if (cb.checked) {
          // If we were in "All" mode (empty array), start fresh with this one
          if (selected.length === 0) {
            selected = [value];
          } else {
            selected.push(value);
          }
        } else {
          selected = selected.filter(r => r !== value);
        }

        // If nothing selected, revert to All (empty array)
        if (selected.length === 0) {
          this.filters.district = [];
        } else {
          this.filters.district = selected;
        }

        this.updateRegionDropdown();
        this.loadIncidents();
      });
    });
  }

  updateFooterRegionDropdown() {
    const menu = $('#footer-region-menu');
    const triggerText = $('#footer-region-trigger-text');
    if (!menu || !triggerText) return;

    // Default: All selected
    const priorityRegion = 'Leaside-Thorncliffe';
    const otherRegions = this.regions.filter(r => r !== priorityRegion).sort();

    let html = `
      <label class="dropdown-item">
        <input type="checkbox" 
          value="ALL" 
          name="regions_all"
        class="footer-region-checkbox-all rounded text-blue-600 focus:ring-blue-500"
        >
        <span class="font-semibold">All Regions</span>
      </label>
      <div class="border-b my-1"></div>
      
      <label class="dropdown-item bg-blue-50">
        <input type="checkbox" 
          value="${priorityRegion}" 
          name="regions"
          class="footer-region-checkbox rounded text-blue-600 focus:ring-blue-500"
          checked
        >
        <span class="font-medium text-blue-800">${priorityRegion}</span>
      </label>
      <div class="border-b my-1"></div>
    `;

    html += otherRegions.map(region => `
      <label class="dropdown-item">
        <input type="checkbox" 
          value="${region}" 
          name="regions"
          class="footer-region-checkbox rounded text-blue-600 focus:ring-blue-500"
        >
        <span>${region}</span>
      </label>
    `).join('');

    menu.innerHTML = html;
    triggerText.textContent = priorityRegion;

    // Bind local events for this dropdown
    const allCheckbox = menu.querySelector('.footer-region-checkbox-all');
    const checkboxes = menu.querySelectorAll('.footer-region-checkbox');

    // "All" toggle
    allCheckbox?.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      checkboxes.forEach(cb => cb.checked = isChecked);
      triggerText.textContent = isChecked ? 'All Regions' : '0 Regions Selected';
    });

    // Individual toggle
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const allChecked = Array.from(checkboxes).every(c => c.checked);
        if (allCheckbox) allCheckbox.checked = allChecked;

        // Update text
        const checkedCount = Array.from(checkboxes).filter(c => c.checked).length;
        if (allChecked) {
          triggerText.textContent = 'All Regions';
        } else {
          triggerText.textContent = `${checkedCount} Regions Selected`;
        }
      });
    });
  }

  updateFooterTypeDropdown() {
    this._updateFooterDropdown(
      'footer-type-menu',
      'footer-type-trigger-text',
      CONFIG.INCIDENT_TYPES.map(t => ({ value: t.value, label: t.label })),
      'types',
      'All Types'
    );
  }

  updateFooterImpactDropdown() {
    const impacts = [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    ];
    this._updateFooterDropdown(
      'footer-impact-menu',
      'footer-impact-trigger-text',
      impacts,
      'impacts',
      'All Impact Levels'
    );
  }

  _updateFooterDropdown(menuId, triggerTextId, items, inputName, allLabel) {
    const menu = $('#' + menuId);
    const triggerText = $('#' + triggerTextId);
    if (!menu || !triggerText) return;

    let html = `
      <label class="dropdown-item">
        <input type="checkbox" 
          value="ALL" 
          class="footer-${inputName}-checkbox-all rounded text-blue-600 focus:ring-blue-500"
          checked
        >
        <span class="font-semibold">${allLabel}</span>
      </label>
      <div class="border-b my-1"></div>
    `;

    html += items.map(item => `
      <label class="dropdown-item">
        <input type="checkbox" 
          value="${item.value}" 
          name="${inputName}"
          class="footer-${inputName}-checkbox rounded text-blue-600 focus:ring-blue-500"
          checked
        >
        <span>${item.label}</span>
      </label>
    `).join('');

    menu.innerHTML = html;
    triggerText.textContent = allLabel;

    const allCheckbox = menu.querySelector(`.footer-${inputName}-checkbox-all`);
    const checkboxes = menu.querySelectorAll(`.footer-${inputName}-checkbox`);

    allCheckbox?.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      checkboxes.forEach(cb => cb.checked = isChecked);
      triggerText.textContent = isChecked ? allLabel : '0 Selected';
    });

    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const allChecked = Array.from(checkboxes).every(c => c.checked);
        if (allCheckbox) allCheckbox.checked = allChecked;

        const checkedCount = Array.from(checkboxes).filter(c => c.checked).length;
        if (allChecked) {
          triggerText.textContent = allLabel;
        } else {
          triggerText.textContent = `${checkedCount} Selected`;
        }
      });
    });
  }

  getHTML() {
    const { grayText, grayBg, blue, green } = CONFIG.COLORS;

    return `
      <div class="min-h-screen flex flex-col">
        ${this.getHeaderHTML()}
        ${this.getHeroBannerHTML()}
        <main class="flex-1 px-6 py-8" style="position:relative;">
          <div class="max-w-[1200px] mx-auto" style="position:relative; z-index:10;">
            ${this.getIntroductionHTML()}

            ${this.getFiltersHTML()}

            <!-- Background Image Container -->
            <div style="position:relative; padding:120px 0;">
              <!-- Background Image with Fade Effects -->
              <div style="
                position:absolute;
                top:0;
                left:50%;
                transform:translateX(-50%);
                width:100vw;
                height:100%;
                z-index:1;
                pointer-events:none;
              ">
                <div style="
                  position:absolute;
                  top:0;
                  left:0;
                  width:100%;
                  height:100%;
                  background-image:url('./assets/img1.jpg');
                  background-size:cover;
                  background-position:center;
                  background-repeat:no-repeat;
                  opacity:0.5;
                "></div>
                <!-- Top Fade -->
                <div style="
                  position:absolute;
                  top:0;
                  left:0;
                  width:100%;
                  height:120px;
                  background:linear-gradient(to bottom, white 0%, transparent 100%);
                  z-index:2;
                "></div>
                <!-- Bottom Fade -->
                <div style="
                  position:absolute;
                  bottom:0;
                  left:0;
                  width:100%;
                  height:120px;
                  background:linear-gradient(to top, white 0%, transparent 100%);
                  z-index:2;
                "></div>
              </div>

              <!-- Table and Map Grid -->
              <div class="grid lg:grid-cols-2 gap-6 mb-8" style="position:relative; z-index:5;">
                ${this.getTableHTML()}
                ${this.getMapHTML()}
              </div>
            </div>


          </div>
        </main>

        <div id="detail-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50"></div>
        <div id="fullscreen-backdrop" class="fullscreen-backdrop"></div>

        ${this.getFooterHTML()}
      </div>
    `;
  }

  getHeaderHTML() {
    const { black, lbpaGreen } = CONFIG.COLORS;

    return `
      <header class="sticky top-0 z-50 min-h-[72px] flex items-center px-6" style="background-color:rgba(255,255,255,0.45); backdrop-filter:blur(10px); box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div class="w-full max-w-[1200px] mx-auto flex items-center justify-between">
          <div class="flex items-center">
            <h1 class="text-xl sm:text-2xl font-bold" style="color:${black}">Leaside Business Park</h1>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-6">
            <a href="#/" class="hover:underline transition-colors" style="color:${black}">Home</a>
            <a href="#/" class="hover:underline transition-colors" style="color:${black}">About</a>
            <a href="#/" class="hover:underline font-semibold transition-colors" style="color:${lbpaGreen}">Traffic & Transit Updates</a>
          </nav>

          <!-- Mobile Menu Button -->
          <button id="mobile-menu-btn" class="md:hidden p-2 rounded hover:bg-gray-100" style="color:${black}" aria-label="Toggle menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>

        <!-- Mobile Menu Dropdown -->
        <div id="mobile-menu" class="hidden absolute top-[72px] left-0 right-0 shadow-lg" style="background-color:rgba(255,255,255,0.9); border-top:1px solid rgba(0,0,0,0.1)">
          <nav class="flex flex-col p-4 gap-3">
            <a href="#/" class="hover:underline py-2 transition-colors" style="color:${black}">Home</a>
            <a href="#/" class="hover:underline py-2 transition-colors" style="color:${black}">About</a>
            <a href="#/" class="hover:underline py-2 font-semibold transition-colors" style="color:${lbpaGreen}">Traffic & Transit Updates</a>
          </nav>
        </div>
      </header>
    `;
  }

  getHeroBannerHTML() {
    const { lbpaGreen } = CONFIG.COLORS;

    return `
      <div style="position:relative; width:100%; height:500px; overflow:hidden; margin-top:-72px; padding-top:72px;">
        <!-- Construction Image Background (img3.jpg) -->
        <div style="
          position:absolute;
          top:0;
          left:0;
          width:100%;
          height:100%;
          background-image: url('./assets/img3.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index:1;
        "></div>

        <!-- Very Light Overlay for text readability -->
        <div style="
          position:absolute;
          top:0;
          left:0;
          width:100%;
          height:100%;
          background: linear-gradient(135deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.2) 100%);
          z-index:2;
        "></div>

        <!-- Content -->
        <div class="max-w-[1200px] mx-auto px-6" style="position:relative; height:100%; display:flex; flex-direction:column; justify-content:center; z-index:10;">
          <h1 class="text-5xl font-bold mb-4" style="color:white; text-shadow: 2px 2px 8px rgba(0,0,0,0.9);">
            Traffic & Transit Updates
          </h1>
          <p class="text-xl mb-6" style="color:white; max-width:700px; text-shadow: 1px 1px 6px rgba(0,0,0,0.9);">
            Stay informed about traffic, construction, and transit impacts around Leaside Business Park
          </p>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="text-sm" style="color:white; opacity:0.95; text-shadow: 1px 1px 4px rgba(0,0,0,0.9);" id="last-updated-hero">Loading...</span>
          </div>
        </div>

        <!-- Fade to White at Bottom -->
        <div style="
          position:absolute;
          bottom:0;
          left:0;
          width:100%;
          height:100px;
          background: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.7) 60%, white 100%);
          z-index:3;
        "></div>
      </div>
    `;
  }

  getIntroductionHTML() {
    const { grayText, green } = CONFIG.COLORS;

    return `
      <div class="mb-8 p-6 rounded-lg border" style="border-color:#e5e7eb; background-color:#f9fafb;">
        <p class="text-base leading-relaxed mb-4" style="color:${grayText}">
          Stay up to date on what's happening around Leaside Business Park.
          Explore the live map below for real-time traffic, construction, and transit updates — helping you plan your route, avoid delays, and keep your business moving.
        </p>
        <p class="text-base" style="color:${grayText}">
          Want updates delivered to you?
          <button id="intro-subscribe-btn" class="inline-flex items-center font-semibold hover:underline" style="color:${green}">
            Subscribe below
          </button>
          to receive the latest alerts by email.
        </p>
      </div>
    `;
  }

  getFiltersHTML() {
    const { grayText, grayBg } = CONFIG.COLORS;

    return `
      <div class="flex flex-wrap gap-3 p-4 mb-6 rounded-lg filter-panel">
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
          <div class="custom-dropdown" id="region-dropdown">
            <div class="dropdown-trigger" id="region-trigger">
              <span id="region-trigger-text">Select Regions</span>
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div class="dropdown-menu" id="region-menu">
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

        <div class="flex items-end">
          <button id="reset-filters" class="px-4 py-2 rounded border bg-white hover:bg-gray-50" style="color:${grayText}">
            Reset Filters
          </button>
        </div>
      </div>
    `;
  }

  getTableHTML() {
    const { grayText, grayBg } = CONFIG.COLORS;

    return `
      <div class="rounded-lg border overflow-hidden">
        <div class="p-3 flex items-center justify-between" style="background-color:${grayBg}">
          <h3 class="font-semibold" style="color:${grayText}">Table View</h3>
        </div>
        <div id="table-container" class="overflow-auto max-h-600">
          <div class="flex items-center justify-center p-8">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    `;
  }

  getMapHTML() {
    const { grayText, grayBg } = CONFIG.COLORS;

    return `
      <div id="map-card" class="rounded-lg border overflow-hidden relative bg-white flex flex-col">
        <div class="p-3 flex items-center justify-between flex-shrink-0" style="background-color:${grayBg}">
          <h3 class="font-semibold" style="color:${grayText}">Map View</h3>
          <button id="map-fullscreen-btn" class="text-gray-600 hover:text-gray-900 focus:outline-none" title="Toggle Fullscreen">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
        <div id="map-container" class="flex-1 relative transition-all duration-300" style="min-height:600px;">
          ${this.getMapLegendHTML()}
        </div>
      </div>
    `;
  }

  getMapLegendHTML() {
    const { grayText } = CONFIG.COLORS;

    return `
      <div class="map-legend bg-white rounded-lg card-shadow p-3 max-w-[200px]">
        <div class="text-sm mb-2 font-semibold" style="color:${grayText}">Legend</div>
        <div class="space-y-1 text-xs" style="color:${grayText}">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background-color:${CONFIG.COLORS.red}"></div>
            <span>Road Closure / Accident</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background-color:${CONFIG.COLORS.yellow}"></div>
            <span>Construction</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background-color:${CONFIG.COLORS.blue}"></div>
            <span>Transit / Weather</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background-color:${CONFIG.COLORS.green}"></div>
            <span>Special Event</span>
          </div>
        </div>
      </div>
    `;
  }

  getFooterHTML() {
    const { grayText, grayBg, green } = CONFIG.COLORS;

    return `
      <footer class="bg-white border-t" style="border-color:${grayBg};">
        
        <!-- Subscription Form Section -->
        <div class="py-16 px-6 bg-white">
          <div class="max-w-[1200px] mx-auto text-center">
            <h2 class="text-2xl font-bold mb-4" style="color:${CONFIG.COLORS.black}">Get Updates Delivered</h2>
            <p class="text-gray-600 mb-8">
              Sign up for customized email alerts. Choose your frequency and filter by region, type, and impact.
            </p>
            
            <form id="footer-subscribe-form" class="text-left bg-gray-50 p-6 rounded-lg border border-gray-200">
              <!-- Row 1: Email and Frequency -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-1">Email Address</label>
                  <input type="email" name="email" required placeholder="you@example.com" class="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none text-sm" style="color:${grayText}">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Frequency</label>
                  <select name="frequency" class="w-full px-3 py-2 rounded border bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" style="color:${grayText}">
                    <option value="daily">Daily (Every Morning)</option>
                    <option value="weekly">Weekly (Mondays)</option>
                    <option value="monthly">Monthly (1st of Month)</option>
                  </select>
                </div>
              </div>

              <!-- Row 2: Filters (3 Columns) -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- Regions -->
                <div>
                  <label class="block text-sm font-medium mb-1">Regions</label>
                  <div class="custom-dropdown" id="footer-region-dropdown">
                    <div class="dropdown-trigger text-sm" id="footer-region-trigger" style="color:${grayText}">
                      <span id="footer-region-trigger-text">Select Regions</span>
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div class="dropdown-menu" id="footer-region-menu">
                      <!-- Checkboxes injected here -->
                      <div class="p-2 text-sm text-gray-400">Loading...</div>
                    </div>
                  </div>
                </div>

                <!-- Types -->
                <div>
                  <label class="block text-sm font-medium mb-1">Incident Types</label>
                  <div class="custom-dropdown" id="footer-type-dropdown">
                    <div class="dropdown-trigger text-sm" id="footer-type-trigger" style="color:${grayText}">
                      <span id="footer-type-trigger-text">All Types</span>
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div class="dropdown-menu" id="footer-type-menu">
                      <!-- Types injected via JS -->
                    </div>
                  </div>
                </div>

                <!-- Impacts -->
                <div>
                  <label class="block text-sm font-medium mb-1">Impact Level</label>
                  <div class="custom-dropdown" id="footer-impact-dropdown">
                    <div class="dropdown-trigger text-sm" id="footer-impact-trigger" style="color:${grayText}">
                      <span id="footer-impact-trigger-text">All Impact Levels</span>
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div class="dropdown-menu" id="footer-impact-menu">
                      <!-- Impacts injected via JS -->
                    </div>
                  </div>
                </div>
              </div>

              <div class="text-center">
                <button type="submit" class="px-8 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity w-full md:w-auto" style="background-color:${green}">
                  Subscribe
                </button>
                <p id="subscribe-msg" class="mt-4 text-sm font-medium hidden"></p>
              </div>
            </form>
          </div>
        </div>

        <!-- Standard Footer -->
        <div class="py-8 px-6 max-w-[1200px] mx-auto space-y-4">
          <div class="p-4 rounded-lg border" style="border-color:#e5e7eb; background-color:white;">
            <h3 class="text-sm font-semibold mb-2" style="color:${grayText}">Disclaimer</h3>
            <p class="text-sm leading-relaxed" style="color:${grayText};opacity:.8">
              Traffic and transit data are sourced from external public feeds, including the City of Toronto, Metrolinx, Ontario 511, and TTC.
              While the LBPA strives to provide timely and accurate information, we cannot guarantee completeness or real-time accuracy.
            </p>
          </div>
          <p class="text-sm text-center" style="color:${grayText};opacity:.7">
            Data sources: City of Toronto, Ontario 511, TTC, Metrolinx. Updated every 6 hours.
          </p>
        </div>
      </footer>
    `;
  }

  bindEvents() {
    // Mobile menu toggle
    $('#mobile-menu-btn')?.addEventListener('click', () => {
      const mobileMenu = $('#mobile-menu');
      if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      const mobileMenu = $('#mobile-menu');
      const mobileBtn = $('#mobile-menu-btn');
      if (mobileMenu && !mobileMenu.classList.contains('hidden') &&
        !mobileMenu.contains(e.target) && !mobileBtn?.contains(e.target)) {
        mobileMenu.classList.add('hidden');
      }
    });

    // Filter events
    $('#filter-type')?.addEventListener('change', (e) => {
      this.filters.type = e.target.value;
      this.loadIncidents();
    });

    // Custom Dropdown Logic
    const dropdown = $('#region-dropdown');
    const trigger = $('#region-trigger');
    const menu = $('#region-menu');

    if (trigger && menu) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          menu.classList.remove('show');
        }
      });

      // Prevent closing when clicking inside menu
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Footer Custom Dropdown Logic (Generic)
    ['region', 'type', 'impact'].forEach(type => {
      const dropdown = $(`#footer-${type}-dropdown`);
      const trigger = $(`#footer-${type}-trigger`);
      const menu = $(`#footer-${type}-menu`);

      if (trigger && menu) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          // Close others
          $$('.custom-dropdown .dropdown-menu').forEach(m => {
            if (m !== menu) m.classList.remove('show');
          });
          menu.classList.toggle('show');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
          if (!dropdown.contains(e.target)) {
            menu.classList.remove('show');
          }
        });

        // Prevent closing when clicking inside menu
        menu.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    });

    $('#filter-impact')?.addEventListener('change', (e) => {
      this.filters.impact = e.target.value;
      this.loadIncidents();
    });

    // Date Filters
    $('#filter-date-from')?.addEventListener('change', (e) => {
      this.filters.date_from = e.target.value;
      this.loadIncidents();
    });

    $('#filter-date-to')?.addEventListener('change', (e) => {
      this.filters.date_to = e.target.value;
      this.loadIncidents();
    });

    $('#reset-filters')?.addEventListener('click', () => {
      this.filters = {
        district: ['Leaside-Thorncliffe']
      };
      $('#filter-type').value = '';
      $('#filter-impact').value = '';
      $('#filter-date-from').value = '';
      $('#filter-date-to').value = '';
      this.updateRegionDropdown(); // Re-render checkboxes
      this.loadIncidents();
    });

    // Footer Subscription Form
    const subForm = $('#footer-subscribe-form');
    if (subForm) {
      subForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = subForm.querySelector('button[type="submit"]');
        const msg = $('#subscribe-msg');
        const originalText = btn.textContent;

        // Gather data
        const formData = new FormData(subForm);
        const data = {
          email: formData.get('email'),
          frequency: formData.get('frequency'),
          filters: {
            regions: formData.getAll('regions'),
            types: formData.getAll('types'),
            impacts: formData.getAll('impacts')
          }
        };

        try {
          btn.disabled = true;
          btn.textContent = 'Subscribing...';
          msg.classList.add('hidden');
          msg.className = 'mt-4 text-sm font-medium hidden'; // reset classes

          const response = await fetch('./api/public/subscribe.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          const result = await response.json();

          msg.classList.remove('hidden');
          if (result.success) {
            msg.textContent = '✅ Successfully subscribed! Check your email for confirmation.';
            msg.classList.add('text-green-600');
            subForm.reset();
          } else {
            msg.textContent = '❌ ' + (result.error || 'Failed to subscribe.');
            msg.classList.add('text-red-600');
          }
        } catch (err) {
          console.error(err);
          msg.classList.remove('hidden');
          msg.textContent = '❌ An error occurred. Please try again.';
          msg.classList.add('text-red-600');
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });
    }

    // Subscribe buttons (scroll to footer)
    const scrollToFooter = () => {
      const form = $('#footer-subscribe-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight effect
        form.classList.add('ring-4', 'ring-blue-100');
        setTimeout(() => form.classList.remove('ring-4', 'ring-blue-100'), 2000);
      }
    };

    $('#subscribe-btn')?.addEventListener('click', scrollToFooter);
    $('#intro-subscribe-btn')?.addEventListener('click', scrollToFooter);

    // Note: Detail view subscribe button is bound dynamically in showDetail()
    // We need to update that too.
    // Close subscribe modal
    $('#close-subscribe')?.addEventListener('click', () => {
      this.subscribeModal.hide();
    });

    // Fullscreen Map Toggle
    const fsBtn = $('#map-fullscreen-btn');
    const mapCard = $('#map-card');
    const backdrop = $('#fullscreen-backdrop');

    // Placeholder for restoring map position
    this.mapPlaceholder = document.createComment('map-placeholder');

    if (fsBtn && mapCard) {
      fsBtn.addEventListener('click', () => {
        const isFullscreen = mapCard.classList.contains('map-fullscreen');

        if (!isFullscreen) {
          // Enter Fullscreen
          // 1. Insert placeholder
          mapCard.parentNode.insertBefore(this.mapPlaceholder, mapCard);
          // 2. Move to body
          document.body.appendChild(mapCard);
          // 3. Add class
          mapCard.classList.add('map-fullscreen');
          backdrop?.classList.add('active');
          // 4. Update Icon (Compress)
          fsBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
        } else {
          // Exit Fullscreen
          // 1. Remove class
          mapCard.classList.remove('map-fullscreen');
          backdrop?.classList.remove('active');
          // 2. Move back to placeholder
          if (this.mapPlaceholder.parentNode) {
            this.mapPlaceholder.parentNode.insertBefore(mapCard, this.mapPlaceholder);
            this.mapPlaceholder.parentNode.removeChild(this.mapPlaceholder);
          }
          // 3. Update Icon (Expand)
          fsBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>`;
        }

        // Force map resize recalculation after transition
        setTimeout(() => {
          if (this.map) this.map.invalidateSize();
        }, 300);
      });

      // Close on backdrop click
      backdrop?.addEventListener('click', () => {
        if (mapCard.classList.contains('map-fullscreen')) {
          fsBtn.click();
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mapCard.classList.contains('map-fullscreen')) {
          fsBtn.click();
        }
      });
    }
  }




  async loadIncidents() {
    try {
      const response = await api.getIncidents(this.filters);

      if (response.success && response.data) {
        this.incidents = response.data.items || [];
        this.renderTable();
        this.renderMap();
        this.updateLastUpdated();
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  renderTable() {
    const container = $('#table-container');
    if (!container) return;

    if (this.incidents.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-500">
          No incidents found matching your filters.
        </div>
      `;
      return;
    }

    // Sort incidents: Start Date DESC, then End Date DESC
    this.incidents.sort((a, b) => {
      const startA = new Date(a.start_date || 0);
      const startB = new Date(b.start_date || 0);
      if (startB - startA !== 0) return startB - startA;

      const endA = new Date(a.end_date || 0);
      const endB = new Date(b.end_date || 0);
      return endB - endA;
    });

    const { grayText, blue } = CONFIG.COLORS;

    container.innerHTML = `
      <table class="w-full table-fixed">
        <thead class="sticky top-0 z-10 border-b" style="background-color:#f3f4f6;"> <!-- Hardcoded gray-100 for opacity -->
          <tr>
            <th class="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm w-[45%]" style="color:${grayText}">Location</th>
            <th class="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm w-[20%]" style="color:${grayText}">Dates</th>
            <th class="px-2 sm:px-3 py-2 text-center text-xs sm:text-sm w-[15%]" style="color:${grayText}">Type</th>
            <th class="px-2 sm:px-3 py-2 text-right text-xs sm:text-sm w-[15%]" style="color:${grayText}">Impact</th>
            <th class="px-2 sm:px-3 py-2 text-right text-xs sm:text-sm w-[5%]"></th>
          </tr>
        </thead>
        <tbody>
          ${this.incidents.map((incident, idx) => `
            <tr class="border-t hover:bg-gray-50 cursor-pointer detail-row ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}" data-incident-id="${incident.id}">
              <td class="px-2 sm:px-3 py-3 truncate" style="color:${grayText}">
                <div class="text-xs sm:text-sm font-medium whitespace-normal">${this.escapeHTML(incident.title || 'N/A')}</div>
                <div class="text-[10px] sm:text-xs opacity-60 mt-1">${this.escapeHTML(incident.district || 'N/A')}</div>
              </td>
              <td class="px-2 sm:px-3 py-3" style="color:${grayText}">
                <div class="text-[10px] sm:text-xs">
                  <span class="font-medium">Start:</span> ${this.formatDate(incident.start_date).split(',')[0]}
                </div>
                ${incident.end_date ? `
                <div class="text-[10px] sm:text-xs opacity-80">
                  <span class="font-medium">End:</span> ${this.formatDate(incident.end_date).split(',')[0]}
                </div>` : '<div class="text-[10px] sm:text-xs opacity-60">Ongoing</div>'}
              </td>
              <td class="px-2 sm:px-3 py-3 text-center">
                <span class="px-1.5 py-0.5 rounded text-[10px] sm:text-xs whitespace-nowrap type-${(incident.type || '').toLowerCase()}" style="color:${grayText}">
                  ${this.escapeHTML(this.formatTypeLabel(incident.type))}
                </span>
              </td>
              <td class="px-2 sm:px-3 py-3 text-right">
                <span class="px-1.5 py-0.5 rounded text-[10px] sm:text-xs whitespace-nowrap impact-${(incident.impact || 'low').toLowerCase()}" style="color:${grayText}">
                  ${this.escapeHTML(incident.impact || 'N/A')}
                </span>
              </td>
              <td class="px-2 sm:px-3 py-3 text-right">
                <button class="text-gray-400 hover:text-blue-600 transition-colors">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Bind row click for details (better UX than just the chevron)
    $$('.detail-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.incidentId);
        this.showDetail(id);
      });
    });
  }

  initMap() {
    const container = $('#map-container');
    if (!container) return;

    // Initialize map centered on Toronto
    if (!this.map) {
      this.map = L.map('map-container', {
        center: [43.6532, -79.3832], // Toronto coordinates
        zoom: 11,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(this.map);
    }
  }

  renderMap() {
    if (!this.map) {
      this.initMap();
    }

    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Add new markers
    const incidentsWithCoords = this.incidents.filter(incident => {
      // Handle both array and object coordinate formats
      if (Array.isArray(incident.coordinates) && incident.coordinates.length === 2) {
        return true;
      }
      if (incident.coordinates && incident.coordinates.lat && incident.coordinates.lon) {
        return true;
      }
      return false;
    });

    incidentsWithCoords.forEach(incident => {
      let lat, lon;
      if (Array.isArray(incident.coordinates)) {
        [lat, lon] = incident.coordinates;
      } else {
        lat = incident.coordinates.lat;
        lon = incident.coordinates.lon;
      }

      const color = this.getMarkerColor(incident.type);

      // Create custom icon
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Create marker
      const marker = L.marker([lat, lon], { icon })
        .bindPopup(this.getMarkerPopupHTML(incident))
        .addTo(this.map);

      this.markers.push(marker);
    });

    // Fit bounds if we have markers
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  getMarkerPopupHTML(incident) {
    return `
      <div style="min-width:200px;">
        <h3 class="font-semibold mb-2" style="color:${CONFIG.COLORS.grayText}">
          ${this.escapeHTML(incident.title || 'N/A')}
        </h3>
        <div class="text-sm mb-2" style="color:${CONFIG.COLORS.grayText};opacity:0.8">
          <strong>Type:</strong> ${this.escapeHTML(this.formatTypeLabel(incident.type))}<br/>
          <strong>Impact:</strong> ${this.escapeHTML(incident.impact || 'N/A')}<br/>
          <strong>Region:</strong> ${this.escapeHTML(incident.district || 'N/A')}<br/>
          <strong>Start:</strong> ${this.formatDate(incident.start_date)}
        </div>
        <button
          onclick="window.viewIncidentDetail(${incident.id})"
          class="px-3 py-1 rounded text-xs text-white"
          style="background-color:${CONFIG.COLORS.blue}">
          View Details
        </button>
      </div>
    `;
  }

  getMarkerColor(type) {
    const colors = {
      road_closure: CONFIG.COLORS.red,
      construction: CONFIG.COLORS.yellow,
      accident: CONFIG.COLORS.red,
      transit_delay: CONFIG.COLORS.blue,
      special_event: CONFIG.COLORS.green,
      weather: CONFIG.COLORS.blue,
      other: CONFIG.COLORS.grayText,
    };
    return colors[type] || CONFIG.COLORS.blue;
  }

  showDetail(id) {
    const incident = this.incidents.find(i => i.id === id);
    if (!incident) return;

    const overlay = $('#detail-overlay');
    if (!overlay) return;

    overlay.innerHTML = `
      <div class="bg-white h-full w-full max-w-[480px] p-6 overflow-y-auto shadow-xl" onclick="event.stopPropagation()">
        <div class="flex items-start justify-between mb-6">
          <h2 class="text-xl font-bold" style="color:${CONFIG.COLORS.grayText}">Incident Details</h2>
          <button id="close-detail" class="text-gray-700 hover:bg-gray-100 rounded p-1">✕</button>
        </div>
        <div class="space-y-6">
          <div>
            <h3 class="font-semibold mb-2" style="color:${CONFIG.COLORS.grayText}">
              ${this.escapeHTML(incident.title || 'N/A')}
            </h3>
            <p class="text-sm" style="color:${CONFIG.COLORS.grayText};opacity:.8">
              ${this.escapeHTML(incident.description || 'No description available.')}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="block text-sm mb-1" style="color:${CONFIG.COLORS.grayText};opacity:.7">Type</span>
              <span style="color:${CONFIG.COLORS.grayText}">${this.escapeHTML(this.formatTypeLabel(incident.type))}</span>
            </div>
            <div>
              <span class="block text-sm mb-1" style="color:${CONFIG.COLORS.grayText};opacity:.7">Impact</span>
              <span style="color:${CONFIG.COLORS.grayText}">${this.escapeHTML(incident.impact || 'N/A')}</span>
            </div>
            <div>
              <span class="block text-sm mb-1" style="color:${CONFIG.COLORS.grayText};opacity:.7">Region</span>
              <span style="color:${CONFIG.COLORS.grayText}">${this.escapeHTML(incident.district || 'N/A')}</span>
            </div>
            <div>
              <span class="block text-sm mb-1" style="color:${CONFIG.COLORS.grayText};opacity:.7">Source</span>
              <span style="color:${CONFIG.COLORS.grayText}">
                ${this.escapeHTML(this.formatSourceLabel(incident.source_type))}
                ${incident.source_type === 'metrolinx' && incident.upload_id ?
        `<br><a href="./uploads/${incident.upload_id}.pdf" target="_blank" class="text-xs text-blue-600 hover:underline mt-1 inline-block">View Original PDF</a>`
        : ''}
              </span>
            </div>
            <div>
              <span class="block text-sm mb-1" style="color:${CONFIG.COLORS.grayText};opacity:.7">Start Date</span>
              <span style="color:${CONFIG.COLORS.grayText}">${this.formatDate(incident.start_date)}</span>
            </div>
            <div>
              <span class="block text-sm mb-1" style="color:${CONFIG.COLORS.grayText};opacity:.7">End Date</span>
              <span style="color:${CONFIG.COLORS.grayText}">${this.formatDate(incident.end_date)}</span>
            </div>
          </div>
          <button id="subscribe-detail-btn" class="w-full px-6 py-3 rounded-lg text-white" style="background-color:${CONFIG.COLORS.green}">
            Subscribe to Updates
          </button>
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');

    $('#close-detail')?.addEventListener('click', () => {
      overlay.classList.add('hidden');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });

    $('#subscribe-detail-btn')?.addEventListener('click', () => {
      $('#close-detail')?.click(); // Close the panel first
      const form = $('#footer-subscribe-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  updateLastUpdated() {
    const now = new Date();
    const timestamp = `Last updated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;

    // Update hero banner timestamp
    const heroEl = $('#last-updated-hero');
    if (heroEl) {
      heroEl.textContent = timestamp;
    }
  }

  showError(message) {
    const tableContainer = $('#table-container');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="p-8 text-center">
          <div class="error-message max-w-md mx-auto">
            <strong>Error:</strong> ${this.escapeHTML(message)}
          </div>
        </div>
      `;
    }
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    // Cleanup
    clearTimeout(this.searchTimeout);
    clearTimeout(this.regionTimeout);

    // Clean up map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];

    // Remove global function
    delete window.viewIncidentDetail;
  }
}

export default PublicView;
