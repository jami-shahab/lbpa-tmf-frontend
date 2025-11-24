/**
 * Subscribe Form Component
 * Single Responsibility: Handle email subscription form
 */

import CONFIG from '../core/config.js';
import api from '../core/api.js';

export class SubscribeForm {
  constructor() {
    this.regions = [];
    this.loadRegions();
  }

  async loadRegions() {
    try {
      const response = await api.getRegions();
      if (response.success) {
        this.regions = response.data || [];
      }
    } catch (error) {
      console.warn('Failed to load regions, using defaults');
      // Fallback to common Toronto regions
      this.regions = [];
    }
  }

  render() {
    // Use regions from state or fallback to common Toronto regions
    const regionOptions = this.regions.length > 0
      ? this.regions
      : ['All Regions', 'Downtown', 'North York', 'Scarborough', 'Etobicoke', 'East York', 'York'];

    return `
      <div class="mb-6 p-4 rounded-lg" style="background-color:#f0f9ff; border:1px solid #bfdbfe;">
        <p class="text-sm leading-relaxed text-gray-700">
          Sign up to receive email updates about traffic, construction, and transit impacts in the Leaside Business Park.
          Customize your preferences below to get only the alerts that matter to you.
        </p>
      </div>

      <form id="subscribe-form" class="space-y-6">
        <div>
          <label for="email-input" class="block mb-2 text-gray-700">Email Address *</label>
          <input
            id="email-input"
            required
            type="email"
            name="email"
            placeholder="your.email@example.com"
            class="w-full px-4 py-2 border rounded-lg text-gray-700"
          />
          <span class="text-sm mt-1 block text-gray-600">We'll send updates to this email address</span>
        </div>

        <div>
          <label for="region-select" class="block mb-2 text-gray-700">Select Region</label>
          <select id="region-select" name="region" class="w-full px-4 py-2 border rounded-lg text-gray-700">
            <option value="">All Regions</option>
            ${regionOptions.filter(r => r !== 'All Regions').map(r => `
              <option value="${r}">${r}</option>
            `).join('')}
          </select>
          <span class="text-sm mt-1 block text-gray-600">Optional: Select a specific region to monitor</span>
        </div>

        <fieldset>
          <legend class="block mb-2 text-gray-700">Alert Types *</legend>
          <div class="space-y-2">
            ${CONFIG.INCIDENT_TYPES.map(type => `
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="types" value="${type.value}" class="w-4 h-4" />
                <span class="text-gray-700">${type.label}</span>
              </label>
            `).join('')}
          </div>
          <span class="text-sm mt-1 block text-gray-600">Choose which types of updates you want to receive</span>
        </fieldset>

        <fieldset>
          <legend class="block mb-2 text-gray-700">Impact Levels *</legend>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="impacts" value="low" class="w-4 h-4" />
              <span class="text-gray-700">Low Impact</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="impacts" value="medium" class="w-4 h-4" />
              <span class="text-gray-700">Medium Impact</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="impacts" value="high" class="w-4 h-4" />
              <span class="text-gray-700">High Impact</span>
            </label>
          </div>
          <span class="text-sm mt-1 block text-gray-600">Filter by incident severity</span>
        </fieldset>

        <fieldset>
          <legend class="block mb-2 text-gray-700">Frequency *</legend>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="frequency" value="daily" class="w-4 h-4" checked />
              <span class="text-gray-700">Daily Summary</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="frequency" value="weekly" class="w-4 h-4" />
              <span class="text-gray-700">Weekly Digest</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="frequency" value="monthly" class="w-4 h-4" />
              <span class="text-gray-700">Monthly Report</span>
            </label>
          </div>
        </fieldset>

        <div>
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" name="consent" id="consent-checkbox" class="w-4 h-4 mt-1" />
            <span class="text-gray-700">I agree to receive email updates from LBPA about traffic and transit impacts. You can unsubscribe at any time.</span>
          </label>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="button"
            id="close-subscribe"
            class="flex-1 px-6 py-3 rounded-lg border hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="subscribe-button"
            disabled
            class="flex-1 px-6 py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style="background-color: ${CONFIG.COLORS.green}"
          >
            Subscribe
          </button>
        </div>
      </form>
    `;
  }

  async handleSubmit(formElement) {
    const formData = new FormData(formElement);
    const email = formData.get('email');
    const region = formData.get('region') || null;
    const types = formData.getAll('types');
    const impacts = formData.getAll('impacts');
    const frequency = formData.get('frequency');
    const consent = formData.get('consent');

    if (!email || !consent) {
      alert('Please provide your email and agree to receive updates');
      return false;
    }

    if (types.length === 0) {
      alert('Please select at least one alert type');
      return false;
    }

    try {
      const subscriptionData = {
        email,
        frequency,
        incident_types: types.length > 0 ? types : null,
        impact_levels: impacts.length > 0 ? impacts : null,
        districts: region ? [region] : null,
      };

      const response = await api.subscribe(subscriptionData);

      if (response.success) {
        return {
          success: true,
          message: 'Successfully subscribed! Please check your email to confirm your subscription.',
        };
      } else {
        return {
          success: false,
          message: response.error?.message || 'Subscription failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Subscription failed',
      };
    }
  }

  attachEventListeners() {
    // Enable/disable subscribe button based on consent checkbox
    const consentCheckbox = document.getElementById('consent-checkbox');
    const subscribeButton = document.getElementById('subscribe-button');

    if (consentCheckbox && subscribeButton) {
      consentCheckbox.addEventListener('change', (e) => {
        subscribeButton.disabled = !e.target.checked;
      });
    }
  }

  renderSuccess() {
    return `
      <div class="p-6 text-center">
        <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 class="mb-2 text-xl text-gray-700">Successfully Subscribed!</h3>
        <p class="text-gray-600">You'll receive updates based on your preferences.</p>
      </div>
    `;
  }
}

export default SubscribeForm;
