/**
 * How It Works Page - Utility Functions
 * CODE ORGANIZATION: Separated utility functions for better maintainability
 */

import { initLazyImages as initLazyImagesUtil } from '../utils';
import { getTelegramWebApp } from '../types';
import { createEventListener } from '../cleanup';

/**
 * Check if document is ready
 */
export function isDocumentReady(): boolean {
  return document.readyState !== 'loading';
}

/**
 * Execute callback when document is ready
 */
export function onReady(callback: () => void): void {
  if (isDocumentReady()) {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

/**
 * Prevent orphaned words (prepositions and short words at line end)
 */
export function preventOrphans(): void {
  const prepositions = ['в', 'на', 'с', 'по', 'о', 'у', 'за', 'из', 'к', 'до', 'от', 'об', 'под', 'про', 'для', 'без', 'над', 'при', 'через', 'между', 'среди'];
  const shortWords = ['и', 'а', 'но', 'или', 'как', 'что', 'где', 'чем', 'оно', 'они', 'она', 'он', 'ты', 'мы', 'вы'];
  const wordsToPrevent = [...prepositions, ...shortWords];
  
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, li, .comparison-text, .step-list li, .tariff-list li, .path-description, .tariff-description, .tariff-note');
  
  elements.forEach(element => {
    if (element.innerHTML.includes('<strong>') || element.innerHTML.includes('<span') || element.innerHTML.includes('<em>') || element.innerHTML.includes('<a>')) {
      return;
    }
    
    const htmlElement = element as HTMLElement;
    let text = element.textContent || htmlElement.innerText;
    if (!text || text.trim().length < 10) return;
    
    wordsToPrevent.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b `, 'gi');
      text = text.replace(regex, `${word}\u00A0`);
    });
    
    if (text !== (element.textContent || htmlElement.innerText)) {
      element.textContent = text;
    }
  });
}

/**
 * Initialize lazy loading for images
 */
export function initLazyLoading(): void {
  // DRY: Use shared utility function instead of duplicating lazy image loading logic
  initLazyImagesUtil('img[loading="lazy"], img.lazy-image', '200px');
}

/**
 * Initialize Telegram WebApp fixes
 */
export function initTelegramWebAppFixes(): void {
  function ensureDocumentIsScrollable(): void {
    const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
    if (!isScrollable) {
      document.documentElement.style.setProperty('height', 'calc(100vh + 1px)', 'important');
    }
  }
  
  function preventTelegramCollapse(): void {
    if (window.scrollY === 0) {
      window.scrollTo(0, 1);
    }
  }
  
  ensureDocumentIsScrollable();
  // OPTIMIZED: Debounced resize listener for INP optimization
  let resizeTimeout: ReturnType<typeof setTimeout>;
  const resizeHandler = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(ensureDocumentIsScrollable, 150);
  };
  createEventListener(window, 'resize', resizeHandler, { passive: true });
  
  // TYPESCRIPT: Use type-safe access to Telegram WebApp
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.disableVerticalSwipes?.();
      tg.expand?.();
    } catch (e) {}
    
    createEventListener(document, 'touchstart', preventTelegramCollapse, { passive: true });
  }
}

