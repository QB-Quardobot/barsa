/**
 * How It Works Page - Main Entry Point
 * CODE ORGANIZATION: Centralized orchestration module
 * 
 * This module coordinates all page-specific functionality:
 * - Reveal animations
 * - Swiper sliders
 * - Modals
 * - FAQ
 * - Smooth scroll
 * - Utilities
 */

import { onReady } from './utils';
import { initSmoothScroll } from './scroll';

// Import page-specific modules
import { initRevealAnimations, initHorizontalCardReveal } from '../how-it-works';
import { initFAQ } from '../how-it-works';
import { initTestimonialsSwiper, initStudentModelsSwiper } from '../how-it-works';
import { initPhotoModal, initCurrencyModal } from '../how-it-works';
import { preventOrphans, initLazyLoading, initTelegramWebAppFixes } from './utils';

/**
 * Initialize all How It Works page functionality
 * CODE ORGANIZATION: Single entry point for page initialization
 */
export function initHowItWorks(): void {
  onReady(() => {
    // Initialize in order of priority:
    // 1. Core animations
    initRevealAnimations();
    initHorizontalCardReveal();
    
    // 2. Interactive components
    initFAQ();
    initTestimonialsSwiper();
    initStudentModelsSwiper();
    
    // 3. Utilities
    initTelegramWebAppFixes();
    preventOrphans();
    initLazyLoading();
    
    // 4. Modals
    initPhotoModal();
    initCurrencyModal();
    
    // 5. Navigation
    initSmoothScroll();
    
    // Handle hash after page fully loads (for navigation from other pages)
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      if (hash === 'pricing') {
        // Wait for all content to render
        setTimeout(() => {
          const targetElement = document.getElementById('pricing');
          if (targetElement) {
            const mainContentEl = document.getElementById('main-content') || document.querySelector('main');
            const targetRect = targetElement.getBoundingClientRect();
            const viewportHeight = mainContentEl ? (mainContentEl as HTMLElement).clientHeight : window.innerHeight;
            const offset = viewportHeight * 0.15;
            
            let scrollTop: number;
            
            if (mainContentEl) {
              scrollTop = (mainContentEl as HTMLElement).scrollTop + targetRect.top - offset;
              const maxScroll = (mainContentEl as HTMLElement).scrollHeight - (mainContentEl as HTMLElement).clientHeight;
              scrollTop = Math.min(scrollTop, maxScroll);
              scrollTop = Math.max(0, scrollTop);
              
              (mainContentEl as HTMLElement).scrollTo({
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
        }, 500);
      }
    }
  });
}

