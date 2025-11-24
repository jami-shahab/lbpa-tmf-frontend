/**
 * Modal Component
 * Single Responsibility: Manage modal dialogs
 */

import { $, hideElement, showElement } from '../core/dom.js';

export class Modal {
  constructor(modalId) {
    this.modal = $(modalId);
    this.previousActiveElement = null;
    this.bindEvents();
  }

  bindEvents() {
    // Close on outside click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.hide();
      }

      // Focus trap
      if (e.key === 'Tab' && !this.modal.classList.contains('hidden')) {
        const focusableElements = this.modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  }

  show(content = '') {
    if (!this.modal) return;

    // Store previously focused element
    this.previousActiveElement = document.activeElement;

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
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.setAttribute('role', 'dialog');

    // Focus the first focusable element or the modal itself
    const focusable = this.modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) {
      focusable.focus();
    } else {
      this.modal.setAttribute('tabindex', '-1');
      this.modal.focus();
    }
  }

  hide() {
    if (!this.modal) return;
    hideElement(this.modal);
    this.modal.removeAttribute('aria-modal');
    this.modal.removeAttribute('role');

    // Restore focus
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
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
