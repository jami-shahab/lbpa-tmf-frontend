/**
 * Modal Component
 * Single Responsibility: Manage modal dialogs
 */

import { $, hideElement, showElement } from '../core/dom.js';

export class Modal {
  constructor(modalId) {
    this.modal = $(modalId);
    this.bindEvents();
  }

  bindEvents() {
    // Close on outside click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }

  show(content = '') {
    if (!this.modal) return;

    const contentEl = this.modal.querySelector('[id$="-content"]');
    if (contentEl && content) {
      if (typeof content === 'string') {
        contentEl.innerHTML = content;
      } else if (content instanceof Node) {
        contentEl.innerHTML = '';
        contentEl.appendChild(content);
      }
    }

    showElement(this.modal);
  }

  hide() {
    if (!this.modal) return;
    hideElement(this.modal);
  }
}

export class ConfirmModal extends Modal {
  constructor() {
    super('#confirm-modal');
    this.callback = null;
    this.setupButtons();
  }

  setupButtons() {
    const cancelBtn = $('#confirm-cancel');
    const okBtn = $('#confirm-ok');

    cancelBtn?.addEventListener('click', () => this.hide());
    okBtn?.addEventListener('click', () => {
      if (this.callback) {
        this.callback();
      }
      this.hide();
    });
  }

  confirm(message, callback) {
    const textEl = $('#confirm-modal-text');
    if (textEl) {
      textEl.textContent = message;
    }
    this.callback = callback;
    this.show();
  }
}

export default Modal;
