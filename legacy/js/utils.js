/**
 * FIFA 2026 Smart Stadium - Utility Helpers
 * Provides sanitization, formatting, i18n, and accessibility helpers.
 */

(() => {
  'use strict';

  const Utils = {
    /**
     * Sanitizes input to prevent XSS attacks.
     */
    sanitizeInput(str) {
      if (typeof str !== 'string') return '';
      return str.replace(/[<>&"']/g, (char) => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]).trim();
    },

    /**
     * Formats numbers to localized string.
     */
    formatNumber(n) {
      return new Intl.NumberFormat().format(Number(n) || 0);
    },

    /**
     * Returns a relative time string (e.g., "5m ago").
     */
    timeAgo(timestamp) {
      const elapsed = Date.now() - new Date(timestamp).getTime();
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      return `${hours}h ago`;
    },

    /**
     * Debounces a function call.
     */
    debounce(fn, delay) {
      let timerId;
      return (...args) => {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => fn(...args), delay);
      };
    },

    /**
     * Injects message into the global screen reader live region.
     */
    announceToScreenReader(message) {
      const liveRegion = document.getElementById('aria-live-region');
      if (liveRegion) {
        liveRegion.textContent = message;
      }
    },

    /**
     * Trap keyboard focus inside a modal element.
     */
    trapFocus(modalEl) {
      const focusableEls = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([-1])');
      const firstFocusable = focusableEls[0];
      const lastFocusable = focusableEls[focusableEls.length - 1];

      modalEl.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      });
    }
  };

  window.Utils = Utils;
})();
