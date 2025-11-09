/**
 * How It Works Page - Smooth Scroll Module
 * CODE ORGANIZATION: Separated scroll functionality for better maintainability
 */

import { createEventListener } from '../cleanup';
import { isHTMLElement } from '../types';

/**
 * Scroll to element with smooth behavior
 */
function scrollToElement(targetId: string): void {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;
  
  const mainContentEl = document.getElementById('main-content') || document.querySelector('main');
  const targetRect = targetElement.getBoundingClientRect();
  const viewportHeight = mainContentEl ? (mainContentEl as HTMLElement).clientHeight : window.innerHeight;
  const offset = viewportHeight * 0.2;
  
  let scrollTop: number;
  
  if (mainContentEl) {
    if (!isHTMLElement(mainContentEl)) return;
    scrollTop = mainContentEl.scrollTop + targetRect.top - offset;
    const maxScroll = mainContentEl.scrollHeight - mainContentEl.clientHeight;
    scrollTop = Math.min(scrollTop, maxScroll);
    scrollTop = Math.max(0, scrollTop);
    
    mainContentEl.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  } else {
    scrollTop = window.pageYOffset + targetRect.top - offset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollTop = Math.min(scrollTop, maxScroll);
    scrollTop = Math.max(0, scrollTop);
    
    window.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  }
}

/**
 * Initialize smooth scroll functionality
 */
export function initSmoothScroll(): void {
  const mainContentEl = document.getElementById('main-content') || document.querySelector('main');
  
  // Handle hash on page load
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    if (hash) {
      // Wait for page to fully load before scrolling
      setTimeout(() => {
        scrollToElement(hash);
      }, 300);
    }
  }
  
  // Handle hash changes
  createEventListener(window, 'hashchange', () => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setTimeout(() => {
          scrollToElement(hash);
        }, 100);
      }
    }
  });
  
  // Handle click on anchor links
  createEventListener(document, 'click', (e) => {
    const target = e.target as HTMLElement;
    const linkEl = target.closest('a[data-scroll-to], a[href^="#"]');
    if (!linkEl || !(linkEl instanceof HTMLAnchorElement)) return;
    const link = linkEl;
    
    const href = link.getAttribute('href');
    const scrollTo = link.getAttribute('data-scroll-to');
    
    // Handle external links with hash (e.g., /how-it-works#pricing)
    if (href && href.includes('#') && !href.startsWith('#')) {
      const parts = href.split('#');
      if (parts.length === 2 && parts[0] === '/how-it-works') {
        // This will be handled by navigation
        return;
      }
    }
    
    if (!href || !href.startsWith('#')) return;
    
    const targetId = scrollTo || href.substring(1);
    if (!targetId) return;
    
    e.preventDefault();
    scrollToElement(targetId);
  }, { passive: false });
}

