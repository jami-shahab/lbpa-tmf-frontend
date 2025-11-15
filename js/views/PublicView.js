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
    this.filters = {};
    this.subscribeModal = new Modal('#subscribe-modal');
    this.subscribeForm = new SubscribeForm();
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

            <div class="text-center py-8">
              <button id="subscribe-btn" class="px-8 py-3 rounded-lg text-white hover:opacity-90 transition-opacity" style="background-color:${green}">
                Subscribe for Updates
              </button>
            </div>
          </div>
        </main>

        <div id="detail-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50"></div>

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

        <div class="flex-1 min-w-[180px]">
          <label class="block text-sm mb-1" style="color:${grayText}">Region</label>
          <select id="filter-region" class="w-full px-3 py-2 rounded border bg-white" style="color:${grayText}">
            <option value="">All Regions</option>
          </select>
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
      <div class="rounded-lg border overflow-hidden">
        <div class="p-3 flex items-center justify-between" style="background-color:${grayBg}">
          <h3 class="font-semibold" style="color:${grayText}">Map View</h3>
        </div>
        <div id="map-container" style="height:600px;position:relative;">
          ${this.getMapLegendHTML()}
        </div>
      </div>
    `;
  }

  getMapLegendHTML() {
    const { grayText } = CONFIG.COLORS;

    return `
      <div class="map-legend absolute top-4 right-4 bg-white rounded-lg card-shadow p-3 max-w-[200px]">
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
    const { grayText, grayBg } = CONFIG.COLORS;

    return `
      <footer class="mt-24 py-8 px-6 border-t" style="border-color:${grayBg}; background-color:#f9fafb;">
        <div class="max-w-[1200px] mx-auto space-y-4">
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

    const { grayText, blue } = CONFIG.COLORS;

    container.innerHTML = `
      <table class="w-full">
        <thead class="sticky top-0" style="background-color:${CONFIG.COLORS.grayBg}">
          <tr>
            <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Location</th>
            <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Type</th>
            <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Impact</th>
            <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.incidents.map((incident, idx) => `
            <tr class="border-t hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}">
              <td class="px-3 py-3" style="color:${grayText}">
                <div class="text-sm font-medium">${this.escapeHTML(incident.title || 'N/A')}</div>
                <div class="text-xs opacity-60">${this.escapeHTML(incident.district || 'N/A')}</div>
              </td>
              <td class="px-3 py-3">
                <span class="px-2 py-1 rounded text-xs type-${(incident.type || '').toLowerCase()}" style="color:${grayText}">
                  ${this.escapeHTML(this.formatTypeLabel(incident.type))}
                </span>
              </td>
              <td class="px-3 py-3">
                <span class="px-2 py-1 rounded text-xs impact-${(incident.impact || 'low').toLowerCase()}" style="color:${grayText}">
                  ${this.escapeHTML(incident.impact || 'N/A')}
                </span>
              </td>
              <td class="px-3 py-3">
                <button class="text-xs hover:underline detail-btn" data-incident-id="${incident.id}" style="color:${blue}">
                  Details
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Bind detail buttons
    $$('.detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.incidentId);
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
              <span style="color:${CONFIG.COLORS.grayText}">${this.escapeHTML(this.formatSourceLabel(incident.source_type))}</span>
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
      this.openSubscribeModal();
    });
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

    $('#filter-region')?.addEventListener('change', (e) => {
      this.filters.district = e.target.value;
      this.loadIncidents();
    });

    $('#filter-impact')?.addEventListener('change', (e) => {
      this.filters.impact = e.target.value;
      this.loadIncidents();
    });

    $('#reset-filters')?.addEventListener('click', () => {
      this.filters = {};
      $('#filter-type').value = '';
      $('#filter-region').value = '';
      $('#filter-impact').value = '';
      this.loadIncidents();
    });

    // Subscribe buttons (both main and intro)
    $('#subscribe-btn')?.addEventListener('click', () => {
      this.openSubscribeModal();
    });

    $('#intro-subscribe-btn')?.addEventListener('click', () => {
      this.openSubscribeModal();
      // Smooth scroll to subscribe section
      const subscribeSection = $('#subscribe-btn');
      if (subscribeSection) {
        subscribeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // Close subscribe modal
    $('#close-subscribe')?.addEventListener('click', () => {
      this.subscribeModal.hide();
    });
  }

  openSubscribeModal() {
    const content = this.subscribeForm.render();
    this.subscribeModal.show(content);

    // Attach event listeners for consent checkbox
    this.subscribeForm.attachEventListeners();

    // Bind close button
    $('#close-subscribe')?.addEventListener('click', () => {
      this.subscribeModal.hide();
    });

    // Bind form submit
    const form = $('#subscribe-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const result = await this.subscribeForm.handleSubmit(form);

        if (result && result.success) {
          this.subscribeModal.show(this.subscribeForm.renderSuccess());
          setTimeout(() => this.subscribeModal.hide(), 3000);
        } else if (result && !result.success) {
          alert(result.message || 'Subscription failed. Please try again.');
        }
      });
    }
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
