/**
 * Admin Upload View - PDF Upload and Management
 * Single Responsibility: Handle PDF uploads and preview parsed incidents
 */

import CONFIG from '../core/config.js';
import api from '../core/api.js';
import { $, $$, clearElement } from '../core/dom.js';
import { ConfirmModal } from '../components/Modal.js';

export class AdminUploadView {
  constructor() {
    this.confirmModal = new ConfirmModal();
    this.currentUpload = null;
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
    this.bindEvents();
  }

  getHTML() {
    const { grayText, grayBg, blue, green } = CONFIG.COLORS;

    return `
      <div class="min-h-screen flex flex-col">
        ${this.getAdminHeaderHTML()}
        <main class="flex-1 px-4 sm:px-6 py-6 sm:py-8">
          <div class="max-w-[1200px] mx-auto">
            <div class="mb-6 sm:mb-8">
              <h1 class="mb-2 text-xl sm:text-2xl font-bold" style="color:${grayText}">Report Notices – Upload & Parse</h1>
              <p class="text-sm sm:text-base" style="color:${grayText};opacity:.7">
                Upload PDF files to automatically parse traffic and transit reports
              </p>
            </div>

            <div id="upload-message" class="hidden mb-4"></div>

            <div class="grid lg:grid-cols-3 gap-6 sm:gap-8">
              <div class="lg:col-span-2 space-y-4 sm:space-y-6">
                <div id="upload-zone" class="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors" style="border-color:${grayBg}">
                  <input type="file" id="file-upload" class="hidden" accept=".pdf" />
                  <label for="file-upload" class="cursor-pointer block">
                    <div class="text-4xl mb-4">⬆️</div>
                    <h3 class="mb-2 text-base sm:text-lg font-semibold" style="color:${grayText}">Upload PDF</h3>
                    <p class="mb-4 text-xs sm:text-sm px-2" style="color:${grayText};opacity:.6">
                      <span class="hidden sm:inline">Drag and drop a PDF file here, or click to browse</span>
                      <span class="sm:hidden">Tap to select a PDF file</span>
                    </p>
                    <button type="button" class="px-6 py-2 rounded-lg text-white text-sm sm:text-base" style="background-color:${blue}">
                      Browse Files
                    </button>
                  </label>
                </div>

                <div id="preview-section" class="hidden">
                  <div class="border rounded-lg overflow-hidden">
                    <div class="p-4" style="background-color:${grayBg}">
                      <h3 class="text-lg font-semibold" style="color:${grayText}">Parsed Incidents</h3>
                      <p class="text-xs mt-1" style="color:${grayText};opacity:.7">Review and publish incidents extracted from the PDF</p>
                    </div>
                    <div id="preview-content" class="p-4"></div>
                    <div class="p-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
                      <button id="publish-btn" class="px-6 py-2 rounded-lg text-white text-sm" style="background-color:${green}">
                        Publish All Incidents
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="lg:col-span-1">
                <div class="border rounded-lg p-4 sm:p-6" style="border-color:${grayBg}">
                  <h3 class="mb-4 text-base sm:text-lg font-semibold" style="color:${grayText}">Instructions</h3>
                  <div class="space-y-3 text-sm" style="color:${grayText}">
                    <p>1. Upload a PDF traffic report</p>
                    <p>2. System will automatically parse incidents</p>
                    <p>3. Review parsed data</p>
                    <p>4. Publish to make incidents public</p>
                  </div>
                </div>

                <div class="mt-6 p-4 rounded-lg flex gap-3" style="background-color:rgba(80,136,174,0.1)">
                  <div class="w-5 h-5 flex-shrink-0" style="color:${blue}">ℹ️</div>
                  <p class="text-xs sm:text-sm" style="color:${grayText}">
                    Auto-parsing uses AI to extract key information. Always review before publishing.
                  </p>
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
            <a href="#/admin/upload" class="hover:underline text-sm sm:text-base whitespace-nowrap font-semibold transition-colors" style="color:${lbpaGreen}">Upload Reports</a>
            <a href="#/admin/incidents" class="hover:underline text-sm sm:text-base whitespace-nowrap transition-colors" style="color:${black}">All Incidents</a>
            <a href="#/admin/logs" class="hover:underline text-sm sm:text-base whitespace-nowrap transition-colors" style="color:${black}">Logs & Health</a>
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

  bindEvents() {
    const fileInput = $('#file-upload');
    const uploadZone = $('#upload-zone');
    const browseButton = uploadZone?.querySelector('button');

    // File input change
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFileUpload(file);
      }
    });

    // Browse button click
    browseButton?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput?.click();
    });

    // Drag and drop
    uploadZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone?.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        this.handleFileUpload(file);
      } else {
        this.showMessage('Please upload a PDF file', 'error');
      }
    });

    // Publish button
    $('#publish-btn')?.addEventListener('click', () => {
      this.publishIncidents();
    });
  }

  async handleFileUpload(file) {
    this.showMessage('Uploading and processing PDF...', 'info');

    try {
      const response = await api.uploadFile(file);

      if (response.success && response.data) {
        const results = response.data.results || [];
        const firstResult = results[0];

        if (firstResult && firstResult.success) {
          this.currentUpload = {
            upload_id: firstResult.upload_id,
            preview: firstResult.preview || [],
            statistics: firstResult.statistics,
          };

          this.showMessage(`Successfully processed ${this.currentUpload.preview.length} incidents`, 'success');
          this.showPreview();
        } else {
          this.showMessage(firstResult?.error || 'Upload failed', 'error');
        }
      }
    } catch (error) {
      this.showMessage(`Upload error: ${error.message}`, 'error');
    }
  }

  showPreview() {
    const previewSection = $('#preview-section');
    const previewContent = $('#preview-content');

    if (!previewSection || !previewContent) return;

    previewSection.classList.remove('hidden');

    if (this.currentUpload.preview.length === 0) {
      previewContent.innerHTML = `
        <p class="text-center text-gray-500 py-8">No incidents found in the uploaded PDF.</p>
      `;
      return;
    }

    const { grayText } = CONFIG.COLORS;

    previewContent.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead style="background-color:${CONFIG.COLORS.grayBg}">
            <tr>
              <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Location</th>
              <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Type</th>
              <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Region</th>
              <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">Start Date</th>
              <th class="px-3 py-2 text-left text-sm" style="color:${grayText}">End Date</th>
            </tr>
          </thead>
          <tbody>
            ${this.currentUpload.preview.map((incident, idx) => `
              <tr class="border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                <td class="px-3 py-2 text-sm" style="color:${grayText}">${this.escapeHTML(incident.title || 'N/A')}</td>
                <td class="px-3 py-2 text-sm" style="color:${grayText}">${this.escapeHTML(this.formatTypeLabel(incident.type))}</td>
                <td class="px-3 py-2 text-sm" style="color:${grayText}">${this.escapeHTML(incident.district || 'N/A')}</td>
                <td class="px-3 py-2 text-sm" style="color:${grayText}">${this.formatDate(incident.start_date)}</td>
                <td class="px-3 py-2 text-sm" style="color:${grayText}">${this.formatDate(incident.end_date)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async publishIncidents() {
    if (!this.currentUpload) return;

    this.confirmModal.confirm(
      `Publish ${this.currentUpload.preview.length} incident(s)? This will make them visible to the public.`,
      async () => {
        try {
          this.showMessage('Publishing incidents...', 'info');

          const response = await api.publishUpload(this.currentUpload.upload_id);

          if (response.success) {
            this.showMessage(`Successfully published ${response.data.updated || 0} incidents`, 'success');

            // Reset upload state
            this.currentUpload = null;
            $('#preview-section')?.classList.add('hidden');
            $('#file-upload').value = '';
          }
        } catch (error) {
          this.showMessage(`Publish error: ${error.message}`, 'error');
        }
      }
    );
  }

  showMessage(message, type = 'info') {
    const messageEl = $('#upload-message');
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
    // Cleanup
  }
}

export default AdminUploadView;
