/**
 * DOM Utilities
 * Single Responsibility: Provide helper functions for DOM manipulation
 */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  });

  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
};

export const clearElement = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

export const showElement = (element) => {
  element.classList.remove('hidden');
};

export const hideElement = (element) => {
  element.classList.add('hidden');
};

export const toggleElement = (element, show) => {
  if (show) {
    showElement(element);
  } else {
    hideElement(element);
  }
};

export default {
  $,
  $$,
  createElement,
  clearElement,
  showElement,
  hideElement,
  toggleElement,
};
