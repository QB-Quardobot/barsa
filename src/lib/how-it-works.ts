/**
 * How It Works Page - Consolidated JavaScript Module
 * 
 * OPTIMIZED: All scroll/touch event listeners must use { passive: true } for better performance
 * This prevents blocking the main thread during scroll/touch events
 */

import { scheduleRAF } from './reveal';
// DRY: Use shared utility for lazy image loading
import { initLazyImages as initLazyImagesUtil } from './utils';
// ERROR HANDLING: Use safe DOM utilities for better error handling
import { safeGetElementById, safeQuerySelector, safeQuerySelectorAll, safeAddEventListener, withErrorBoundary } from './safe-dom';
// MEMORY MANAGEMENT: Use cleanup manager for proper resource cleanup
import { registerCleanup, createObserver, createEventListener } from './cleanup';
// TYPESCRIPT: Use type-safe utilities and type guards
import { 
  isHTMLElement, 
  isHTMLImageElement, 
  isHTMLAnchorElement,
  isSwiperAvailable,
  getSwiperConstructor,
  isTelegramWebAppAvailable,
  getTelegramWebApp,
  type SwiperInstance,
  type SwiperConfig as SwiperConfigType
} from './types';

function isDocumentReady(): boolean {
  return document.readyState !== 'loading';
}

function onReady(callback: () => void): void {
  if (isDocumentReady()) {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}


export function initHorizontalCardReveal(): void {
  const cards = document.querySelectorAll('.work-step');
  
  if (cards.length === 0) return;
  
  // OPTIMIZED: Increased rootMargin to 200px for better pre-loading
  // Added progressive thresholds [0, 0.25, 0.5] for gradual reveal
  const observerOptions = {
    root: null,
    rootMargin: '200px 0px 200px 0px', // Pre-load 200px before and after viewport
    threshold: [0, 0.25, 0.5] // Progressive reveal at 0%, 25%, and 50% visibility
  };
  
  // Track active card for will-change optimization
  let activeCard: HTMLElement | null = null;
  
  const observer = new IntersectionObserver((entries) => {
    // Batch processing for better performance using RAF pooling
    scheduleRAF(() => {
      entries.forEach((entry) => {
        // TYPESCRIPT: Use type guard instead of unsafe assertion
        if (!isHTMLElement(entry.target)) return;
        const card = entry.target;
        const cardIndex = parseInt(card.dataset.step || '1') - 1;
        const stepContentEl = card.querySelector('.step-content');
        if (!isHTMLElement(stepContentEl)) return;
        const stepContent = stepContentEl;
        
        if (entry.isIntersecting) {
          // Progressive reveal based on intersection ratio
          const ratio = entry.intersectionRatio;
          
          // Start revealing at 25% visibility
          if (ratio >= 0.25 && !card.classList.contains('is-visible')) {
            const delay = cardIndex * 100; // Reduced delay for faster reveal
            
            setTimeout(() => {
              // OPTIMIZED: Remove will-change from previous active card BEFORE switching
              // This frees GPU memory immediately
              if (activeCard && activeCard !== card) {
                // TYPESCRIPT: Use type guard instead of unsafe assertion
                const prevContentEl = activeCard.querySelector('.step-content');
                if (isHTMLElement(prevContentEl)) {
                  const prevContent = prevContentEl;
                  prevContent.style.willChange = 'auto'; // Free GPU memory
                }
              }
              
              // Set active card
              activeCard = card;
              
              // OPTIMIZED: Add will-change ONLY before animation starts
              if (stepContent) {
                stepContent.style.willChange = 'transform, opacity';
              }
              
              // Enable pointer events on active card (CSS handles this, but ensure it's set)
              card.style.pointerEvents = 'auto';
              
              card.classList.add('is-visible');
              
              // OPTIMIZED: Remove will-change after animation completes
              // Listen for transition end to free GPU memory immediately
              const removeWillChange = () => {
                if (stepContent && stepContent.style.willChange !== 'auto') {
                  stepContent.style.willChange = 'auto'; // Free GPU memory
                }
                stepContent?.removeEventListener('transitionend', removeWillChange);
              };
              
              if (stepContent) {
                stepContent.addEventListener('transitionend', removeWillChange, { once: true });
                // Fallback: remove after reasonable animation duration
                setTimeout(() => {
                  if (stepContent && stepContent.style.willChange !== 'auto') {
                    removeWillChange();
                  }
                }, 500);
              }
            }, delay);
          }
          
          // Full reveal at 50% visibility
          // Note: will-change is already set at 25% visibility, no need to set again
          // This prevents unnecessary GPU memory allocation
        } else {
          // Card is out of viewport
          if (card.classList.contains('is-visible')) {
            // Remove will-change when card is not visible
            if (stepContent) {
              stepContent.style.willChange = 'auto';
            }
            
            // Disable pointer events on inactive cards for performance
            card.style.pointerEvents = 'none';
            
            // Only remove is-visible if card is far above viewport
            if (entry.boundingClientRect.top > window.innerHeight) {
              card.classList.remove('is-visible');
              
              // Clear active card if it's this one
              if (activeCard === card) {
                activeCard = null;
              }
            }
          }
        }
      });
    });
  }, observerOptions);
  
  // Initialize: disable pointer events on all cards except first
  cards.forEach((card, index) => {
    if (index > 0) {
      (card as HTMLElement).style.pointerEvents = 'none';
    }
    observer.observe(card);
  });
  
  // MEMORY MANAGEMENT: Register cleanup for observer
  registerCleanup(() => {
    observer.disconnect();
  });
}

export function initRevealAnimations(): void {
  try {
    // Use the same reveal system as the first page for consistency
    if ((window as any).revealInstance) {
      return; // Already initialized
    }
    
    // Import and initialize reveal animations
    import('./reveal').then((module) => {
      if (typeof module.initReveal === 'function') {
        module.initReveal();
      }
    }).catch((error) => {
      // Fallback: try reveal-init as alternative
      // TYPESCRIPT: Use type-safe check
      if (typeof window.initReveal === 'function') {
        window.initReveal();
      } else {
        import('./reveal-init').then(() => {
          if (typeof (window as any).initReveal === 'function') {
            (window as any).initReveal();
          }
        }).catch(() => {
          // Silently fail - elements will remain visible
        });
      }
    });
  } catch (e) {
    // Silently fail - elements will remain visible
  }
}


/**
 * Initialize FAQ with lazy loading and stagger reveal effect
 * OPTIMIZED: Uses IntersectionObserver for lazy initialization
 * OPTIMIZED: Uses grid-template-rows for smoother animations
 * OPTIMIZED: Adds stagger effect for FAQ items reveal
 * 
 * Best practices:
 * - Lazy initialization: FAQ handlers only initialize when section is near viewport
 * - Performance: Reduces initial JavaScript execution
 * - Fallback: Direct initialization if IntersectionObserver is not supported
 * - Cleanup: Proper observer cleanup after initialization
 */
let faqInitialized = false; // Track initialization state to prevent double initialization
let faqObserverInstance: IntersectionObserver | null = null; // Store observer for cleanup

export function initFAQ(): void {
  const faqSection = document.querySelector('.faq-section') || document.querySelector('.faq-list');
  if (!faqSection) return;
  
  // CRITICAL: Prevent double initialization
  if (faqInitialized) {
    return;
  }
  
  // OPTIMIZED: Check if IntersectionObserver is supported
  if (typeof IntersectionObserver === 'undefined') {
    // Fallback: Initialize immediately if IntersectionObserver is not supported
    // This ensures FAQ works in older browsers
    setupFAQHandlers(faqSection as HTMLElement);
    addStaggerReveal(faqSection as HTMLElement);
    faqInitialized = true;
    return;
  }
  
  // OPTIMIZED: Lazy initialization with IntersectionObserver
  // Don't initialize FAQ listeners until section enters viewport
  // rootMargin: '200px' triggers initialization 200px before section enters viewport
  // threshold: 0.01 ensures trigger even for long sections on small screens
  faqObserverInstance = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      
      // CRITICAL: Check if section is intersecting
      if (entry.isIntersecting) {
        // Section is in viewport or approaching, initialize FAQ
        try {
          setupFAQHandlers(faqSection as HTMLElement);
          
          // Add stagger reveal effect for FAQ items
          addStaggerReveal(faqSection as HTMLElement);
          
          // Mark as initialized
          faqInitialized = true;
          
          // OPTIMIZED: Cleanup observer after initialization
          // Unobserve and disconnect to free resources
          if (faqObserverInstance) {
            faqObserverInstance.unobserve(faqSection);
            faqObserverInstance.disconnect();
            faqObserverInstance = null;
          }
        } catch (error) {
          // Error handling: If initialization fails, try direct initialization
          console.error('[FAQ] Initialization error:', error);
          setupFAQHandlers(faqSection as HTMLElement);
          addStaggerReveal(faqSection as HTMLElement);
          faqInitialized = true;
          
          // Cleanup observer on error
          if (faqObserverInstance) {
            faqObserverInstance.unobserve(faqSection);
            faqObserverInstance.disconnect();
            faqObserverInstance = null;
          }
        }
      }
    },
    {
      // OPTIMIZED: rootMargin for pre-loading
      // '200px' triggers initialization 200px before section enters viewport
      // This ensures FAQ is ready when user scrolls to it
      rootMargin: '200px',
      // OPTIMIZED: threshold for reliable triggering
      // 0.01 ensures trigger even for long sections on small screens
      // Lower threshold is better for long sections
      threshold: 0.01
    }
  );
  
  // Start observing FAQ section
  faqObserverInstance.observe(faqSection);
}

/**
 * Cleanup FAQ observer (for testing or manual cleanup)
 * OPTIMIZED: Properly disconnects observer to prevent memory leaks
 */
export function cleanupFAQObserver(): void {
  if (faqObserverInstance) {
    faqObserverInstance.disconnect();
    faqObserverInstance = null;
  }
  faqInitialized = false;
}

/**
 * Setup FAQ click handlers and toggle functionality
 */
function setupFAQHandlers(faqSection: HTMLElement): void {
  const faqItems = faqSection.querySelectorAll('.faq-item');
  if (faqItems.length === 0) return;
  
  // OPTIMIZED: Initialize all answers as closed (CSS handles the styling via grid-template-rows)
  faqItems.forEach(item => {
    const answer = item.querySelector('.faq-answer') as HTMLElement;
    if (!answer) return;
    
    // CRITICAL FIX: Ensure all FAQ items start in collapsed state
    // Remove any inline styles that might interfere with grid-template-rows
    answer.style.maxHeight = '';
    answer.style.opacity = '';
    answer.style.gridTemplateRows = '';
    answer.style.margin = '';
    
    // CRITICAL: Remove 'open' class to ensure collapsed state
    answer.classList.remove('open');
    
    // CRITICAL: Set aria-expanded to false if not already set
    const question = item.querySelector('.faq-question') as HTMLElement;
    if (question && !question.hasAttribute('aria-expanded')) {
      question.setAttribute('aria-expanded', 'false');
    }
    if (!item.hasAttribute('aria-expanded')) {
      item.setAttribute('aria-expanded', 'false');
    }
  });
  
  faqSection.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const question = target.closest('.faq-question') as HTMLElement;
    if (!question) return;
    
    e.preventDefault();
    const item = question.closest('.faq-item') as HTMLElement;
    if (!item) return;
    
    const answer = item.querySelector('.faq-answer') as HTMLElement;
    if (!answer) return;
    
    const isExpanded = item.getAttribute('aria-expanded') === 'true';
    
    // OPTIMIZED: Close all other items using CSS classes (no inline styles)
    faqItems.forEach(otherItem => {
      if (otherItem !== item) {
        const otherQuestion = otherItem.querySelector('.faq-question') as HTMLElement;
        const otherAnswer = otherItem.querySelector('.faq-answer') as HTMLElement;
        
        if (otherAnswer) {
          // Remove inline styles and use CSS classes
          otherAnswer.style.maxHeight = '';
          otherAnswer.style.opacity = '';
          otherAnswer.style.gridTemplateRows = '';
          otherAnswer.classList.remove('open');
        }
        
        otherItem.setAttribute('aria-expanded', 'false');
        if (otherQuestion) {
          otherQuestion.setAttribute('aria-expanded', 'false');
        }
      }
    });
    
    // OPTIMIZED: Toggle using CSS classes instead of inline styles
    // CSS handles grid-template-rows transition smoothly with spring-based easing
    if (isExpanded) {
      // Close: remove open class and update aria attributes
      answer.classList.remove('open');
      item.setAttribute('aria-expanded', 'false');
      question.setAttribute('aria-expanded', 'false');
    } else {
      // Open: add open class and update aria attributes
      // CSS handles grid-template-rows transition smoothly
      answer.classList.add('open');
      item.setAttribute('aria-expanded', 'true');
      question.setAttribute('aria-expanded', 'true');
    }
  }, { passive: true }); // Use passive listener for better performance
}

/**
 * Add stagger reveal effect for FAQ items
 * OPTIMIZED: Reveals FAQ items with small delay between them for visual appeal
 * 
 * Best practices:
 * - Batch processing with requestAnimationFrame for smooth performance
 * - Respects prefers-reduced-motion for accessibility
 * - Uses will-change for GPU acceleration
 * - Prevents double animation with revealed check
 * - Optimized delay calculation for smooth stagger
 */
function addStaggerReveal(faqSection: HTMLElement): void {
  // OPTIMIZED: Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const faqItems = faqSection.querySelectorAll('.faq-item:not(.faq-revealed)');
  
  if (faqItems.length === 0) return;
  
  // OPTIMIZED: If user prefers reduced motion, show all items immediately
  if (prefersReducedMotion) {
    faqItems.forEach((item) => {
      const element = item as HTMLElement;
      element.classList.add('faq-revealed');
      // Remove initial opacity/transform styles
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
    return;
  }
  
  // OPTIMIZED: Calculate optimal delay based on number of items
  // More items = smaller delay to prevent long total animation time
  // Fewer items = larger delay for more noticeable stagger effect
  const baseDelay = faqItems.length > 10 ? 50 : 80; // 50ms for many items, 80ms for few
  const maxTotalDelay = 1000; // Maximum total animation time (1 second)
  const calculatedDelay = Math.min(baseDelay, Math.floor(maxTotalDelay / faqItems.length));
  
  // OPTIMIZED: Batch all animations in a single requestAnimationFrame
  // This ensures all animations start in the same frame for better performance
  requestAnimationFrame(() => {
    faqItems.forEach((item, index) => {
      const element = item as HTMLElement;
      
      // CRITICAL: Double-check element is not already revealed
      if (element.classList.contains('faq-revealed')) {
        return;
      }
      
      // OPTIMIZED: Set CSS custom property for stagger delay
      // Using calculated delay for optimal animation timing
      element.style.setProperty('--stagger-delay', index.toString());
      
      // OPTIMIZED: Add will-change before animation starts
      // This prepares GPU for animation, improving performance
      element.style.willChange = 'opacity, transform';
      
      // OPTIMIZED: Use setTimeout with calculated delay for stagger effect
      // This creates the sequential reveal animation
      setTimeout(() => {
        // Add revealed class to trigger CSS animation
        element.classList.add('faq-revealed');
        
        // OPTIMIZED: Remove will-change after animation completes
        // Use animationend event for precise timing
        const removeWillChange = () => {
          element.style.willChange = 'auto';
          element.removeEventListener('animationend', removeWillChange);
        };
        
        // Listen for animation end to remove will-change
        element.addEventListener('animationend', removeWillChange, { once: true });
        
        // Fallback: Remove will-change after reasonable time
        setTimeout(() => {
          if (element.style.willChange !== 'auto') {
            element.style.willChange = 'auto';
          }
        }, 600); // Animation duration + buffer
      }, index * calculatedDelay);
    });
  });
}


interface SwiperConfig {
  container: string;
  pagination?: string;
  prevBtn?: string;
  nextBtn?: string;
  autoplayDelay?: number;
}

function createSwiperConfig(config: SwiperConfig) {
  return {
    direction: 'horizontal' as const,
    loop: false,
    speed: 300,
    // MOBILE FIX: Enable watchOverflow for proper mobile handling
    watchOverflow: true,
    slidesPerView: 1,
    spaceBetween: 0,
    centeredSlides: true,
    // MOBILE FIX: Enable cssMode for proper touch handling on mobile
    // This allows browser to use native CSS Scroll Snap which is more stable
    cssMode: true,
    // MOBILE FIX: Disable simulateTouch for proper native scroll support
    simulateTouch: false,
    allowTouchMove: true,
    // MOBILE FIX: Use passive listeners for better performance
    passiveListeners: true,
    touchStartPreventDefault: false,
    touchReleaseOnEdges: true,
    freeMode: false,
    grabCursor: false,
    nested: false,
    resistance: true,
    resistanceRatio: 0.85,
    threshold: 10,
    longSwipes: false,
    longSwipesRatio: 0.5,
    longSwipesMs: 300,
    followFinger: true,
    touchRatio: 1,
    touchAngle: 45,
    touchEventsTarget: 'container',
    preventClicks: true,
    preventClicksPropagation: true,
    // Autoplay - disabled
    autoplay: false,
    // Pagination - disabled, using static pagination
    pagination: false,
    navigation: false, // Отключена навигация, используем только пагинацию
    // MOBILE FIX: Enable watchers for proper slide updates
    watchSlidesProgress: true,
    watchSlidesVisibility: true,
    // MOBILE FIX: Preload images and update on ready to prevent layout shifts
    preloadImages: true,
    updateOnImagesReady: true,
    // MOBILE FIX: Enable lazy loading for images
    lazy: {
      loadPrevNext: true,
      loadPrevNextAmount: 1,
      checkInView: true,
    },
    // MOBILE FIX: Enable observer for dynamic content
    observer: true,
    observeParents: true,
    // MOBILE FIX: Update on window resize
    updateOnWindowResize: true,
    breakpoints: {
      320: { 
        slidesPerView: 1, 
        spaceBetween: 0, 
        centeredSlides: true,
        // MOBILE FIX: Optimize for mobile
        touchRatio: 1,
        threshold: 5,
      },
      768: { 
        slidesPerView: 1, 
        spaceBetween: 0, 
        centeredSlides: true,
      },
      1024: { 
        slidesPerView: 1, 
        spaceBetween: 0, 
        centeredSlides: true,
      },
    },
    on: {
      init: function(swiperInstance: any) {
        // MOBILE FIX: Update Swiper after initialization to fix initial sizing
        if (swiperInstance && typeof swiperInstance.update === 'function') {
          requestAnimationFrame(() => {
            swiperInstance.update();
            swiperInstance.updateSize();
            swiperInstance.updateSlides();
          });
        }
      },
      // MOBILE FIX: Update on images ready
      imagesReady: function(swiperInstance: any) {
        if (swiperInstance && typeof swiperInstance.update === 'function') {
          swiperInstance.update();
          swiperInstance.updateSize();
          swiperInstance.updateSlides();
        }
      },
      // MOBILE FIX: Update on slide change
      slideChange: function(swiperInstance: any) {
        if (swiperInstance && typeof swiperInstance.update === 'function') {
          requestAnimationFrame(() => {
            swiperInstance.updateSize();
          });
        }
      },
      // TYPESCRIPT: Use proper type instead of any
      paginationRender: function(swiperInstance: SwiperInstance) {
        // Pagination rendered
      },
    },
  };
}

function preloadNearbyImages(wrapper: HTMLElement, slides: NodeListOf<Element>): void {
  const currentScroll = wrapper.scrollLeft;
  const slideWidth = wrapper.clientWidth;
  const currentIndex = Math.round(currentScroll / slideWidth);
  
  const preloadIndices = [
    Math.max(0, currentIndex - 1),
    currentIndex,
    Math.min(slides.length - 1, currentIndex + 1)
  ];
  
  preloadIndices.forEach(index => {
    const slide = slides[index] as HTMLElement;
    if (!slide) return;
    
    const images = slide.querySelectorAll('img[loading="lazy"], img.lazy-image') as NodeListOf<HTMLImageElement>;
    images.forEach(img => {
      if (img.src && !img.complete && img.dataset.preloaded !== 'true') {
        img.dataset.preloaded = 'true';
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        document.head.appendChild(link);
      }
    });
  });
}

function setupSwiperNavigation(
  swiperContainer: HTMLElement,
  wrapper: HTMLElement,
  slides: NodeListOf<Element>,
  prevBtn: HTMLElement | null,
  nextBtn: HTMLElement | null
): void {
  if (!wrapper || !slides.length) return;
  
  function getNavButtons() {
    return {
      prevBtn: prevBtn || swiperContainer.querySelector('.swiper-button-prev') as HTMLElement,
      nextBtn: nextBtn || swiperContainer.querySelector('.swiper-button-next') as HTMLElement
    };
  }
  
  function updateNavButtons(): void {
    const { prevBtn, nextBtn } = getNavButtons();
    const scrollLeft = wrapper.scrollLeft;
    const scrollWidth = wrapper.scrollWidth;
    const clientWidth = wrapper.clientWidth;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    
    if (prevBtn) {
      if (scrollLeft <= 10) {
        prevBtn.classList.add('swiper-button-disabled');
        prevBtn.setAttribute('aria-disabled', 'true');
      } else {
        prevBtn.classList.remove('swiper-button-disabled');
        prevBtn.setAttribute('aria-disabled', 'false');
      }
    }
    
    if (nextBtn) {
      if (scrollLeft >= maxScroll - 10) {
        nextBtn.classList.add('swiper-button-disabled');
        nextBtn.setAttribute('aria-disabled', 'true');
      } else {
        nextBtn.classList.remove('swiper-button-disabled');
        nextBtn.setAttribute('aria-disabled', 'false');
      }
    }
  }
  
  function scrollToSlide(direction: 'prev' | 'next'): void {
    const currentScroll = wrapper.scrollLeft;
    const slideWidth = wrapper.clientWidth;
    const scrollWidth = wrapper.scrollWidth;
    const maxScroll = Math.max(0, scrollWidth - slideWidth);
    
    let targetScroll: number;
    
    if (direction === 'prev') {
      const currentSlide = Math.round(currentScroll / slideWidth);
      targetScroll = Math.max(0, (currentSlide - 1) * slideWidth);
    } else {
      const currentSlide = Math.round(currentScroll / slideWidth);
      targetScroll = Math.min(maxScroll, (currentSlide + 1) * slideWidth);
    }
    
    if (targetScroll === currentScroll) return;
    
    scheduleRAF(() => {
      try {
        wrapper.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      } catch (e) {
        wrapper.scrollLeft = targetScroll;
      }
    });
  }
  
  function attachButtonHandlers(button: HTMLElement, direction: 'prev' | 'next'): void {
    const handleClick = (e: Event) => {
      if (button.classList.contains('swiper-button-disabled')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      scrollToSlide(direction);
      return false;
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (button.classList.contains('swiper-button-disabled')) {
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (button.classList.contains('swiper-button-disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      scrollToSlide(direction);
    };
    
    button.addEventListener('click', handleClick, { capture: true, passive: false });
    button.addEventListener('touchend', handleTouchEnd, { capture: true, passive: false });
    button.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    
    if ('ontouchstart' in window === false) {
      button.addEventListener('mousedown', (e) => {
        if (button.classList.contains('swiper-button-disabled')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
      }, { capture: true });
    }
  }
  
  const navButtons = getNavButtons();
  
  if (navButtons.prevBtn) {
    attachButtonHandlers(navButtons.prevBtn, 'prev');
  }
  
  if (navButtons.nextBtn) {
    attachButtonHandlers(navButtons.nextBtn, 'next');
  }
  
  // Optimized scroll handler with throttling
  let scrollTimeout: ReturnType<typeof setTimeout>;
  let rafId: number | null = null;
  
  const handleScroll = () => {
    // Cancel pending RAF
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    
    // Clear existing timeout
    clearTimeout(scrollTimeout);
    
    // Throttle updates to every 16ms (60fps) using RAF
    rafId = requestAnimationFrame(() => {
      updateNavButtons();
      preloadNearbyImages(wrapper, slides);
      rafId = null;
    });
    
    // Also debounce for less frequent updates
    scrollTimeout = setTimeout(() => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          updateNavButtons();
          preloadNearbyImages(wrapper, slides);
          rafId = null;
        });
      }
    }, 100);
  };
  
  wrapper.addEventListener('scroll', handleScroll, { passive: true });
  
  if ('onscrollend' in wrapper) {
    // OPTIMIZED: All scroll/touch listeners must be passive for better performance
    wrapper.addEventListener('scrollend', () => {
      scheduleRAF(() => {
        updateNavButtons();
        preloadNearbyImages(wrapper, slides);
      });
    }, { passive: true });
  }
  
  setTimeout(() => {
    scheduleRAF(() => {
      updateNavButtons();
      preloadNearbyImages(wrapper, slides);
    });
  }, 100);
  
  let resizeTimeout: ReturnType<typeof setTimeout>;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      scheduleRAF(() => {
        updateNavButtons();
      });
    }, 150);
  });
  
  resizeObserver.observe(wrapper);
  resizeObserver.observe(swiperContainer);
}

/**
 * Professional Swiper library loader with multi-CDN fallback
 * Strategy:
 * 1. Check if Swiper is already loaded
 * 2. Try primary CDN (jsdelivr) - fastest and most reliable
 * 3. If primary fails, try alternative CDN (unpkg)
 * 4. If both fail, show static grid fallback
 */
function loadSwiperLibrary(callback: () => void): void {
  // Check if Swiper is already loaded
  if (typeof (window as any).Swiper !== 'undefined') {
    callback();
    return;
  }
  
  // Try primary CDN (jsdelivr)
  const primaryScript = document.createElement('script');
  primaryScript.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
  primaryScript.async = true;
  primaryScript.crossOrigin = 'anonymous';
  
  primaryScript.onload = () => {
    // Primary CDN loaded successfully
    // TYPESCRIPT: Use type-safe check
    if (isSwiperAvailable()) {
      callback();
    } else {
      // Swiper not available even after load - try alternative
      tryAlternativeCDN(callback);
    }
  };
  
  primaryScript.onerror = () => {
    // Primary CDN failed - try alternative
    console.warn('[Swiper] Primary CDN failed, trying alternative CDN...');
    tryAlternativeCDN(callback);
  };
  
  document.head.appendChild(primaryScript);
}

/**
 * Try alternative CDN (unpkg) as fallback
 */
function tryAlternativeCDN(callback: () => void): void {
  const alternativeScript = document.createElement('script');
  alternativeScript.src = 'https://unpkg.com/swiper@11/swiper-bundle.min.js';
  alternativeScript.async = true;
  alternativeScript.crossOrigin = 'anonymous';
  
  alternativeScript.onload = () => {
    // Alternative CDN loaded successfully
    // TYPESCRIPT: Use type-safe check
    if (isSwiperAvailable()) {
      console.log('[Swiper] Loaded from alternative CDN (unpkg)');
      callback();
    } else {
      // Swiper still not available - retry after delay
      console.warn('[Swiper] Library not available after loading from alternative CDN - retrying...');
      setTimeout(() => {
        // TYPESCRIPT: Use type-safe check
    if (isSwiperAvailable()) {
          callback();
        }
      }, 500);
    }
  };
  
  alternativeScript.onerror = () => {
    // Both CDNs failed - retry after delay
    console.warn('[Swiper] All CDNs failed - retrying...');
    setTimeout(() => {
      // TYPESCRIPT: Use type-safe check
    if (isSwiperAvailable()) {
        callback();
      }
    }, 1000);
  };
  
  document.head.appendChild(alternativeScript);
}


// Store Swiper instances for destroy management
const swiperInstances = new Map<HTMLElement, any>();

/**
 * Show static grid fallback when Swiper fails to load
 * This ensures content is always visible, even if Swiper library is unavailable
 */
function showSwiperFallback(swiperContainer: HTMLElement): void {
  // Add fallback class to enable CSS grid layout
  swiperContainer.classList.add('swiper-fallback-grid');
  
  // Find swiper-wrapper and ensure it's visible
  const swiperWrapper = swiperContainer.querySelector('.swiper-wrapper') as HTMLElement;
  if (swiperWrapper) {
    swiperWrapper.classList.add('swiper-fallback-grid');
    
    // Make all slides visible
    const slides = swiperWrapper.querySelectorAll('.swiper-slide');
    slides.forEach((slide) => {
      const slideEl = slide as HTMLElement;
      slideEl.style.opacity = '1';
      slideEl.style.visibility = 'visible';
      slideEl.style.transform = 'none';
    });
  }
  
  // Hide pagination (not needed for static grid)
  const pagination = swiperContainer.querySelector('.static-pagination') as HTMLElement;
  if (pagination) {
    pagination.style.display = 'none';
  }
  
  console.log('[Swiper] Static grid fallback activated');
}

// OPTIMIZED: Global destroy observer for all Swipers (created once)
let globalDestroyObserver: IntersectionObserver | null = null;

// OPTIMIZED: Destroy Swipers when they go far out of viewport to free memory
function setupSwiperDestroyObserver(): void {
  // Create global observer if it doesn't exist
  if (!globalDestroyObserver) {
    globalDestroyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const container = entry.target as HTMLElement;
        const swiper = swiperInstances.get(container);
        
        if (!swiper) return;
        
        // If Swiper is far above viewport (more than 2000px), destroy it to free memory
        // Increased threshold to 2000px to prevent accidental destruction during fast scrolling
        if (!entry.isIntersecting && entry.boundingClientRect.top < -2000) {
          try {
            // Destroy Swiper instance to free memory and remove event listeners
            if (swiper.destroy && typeof swiper.destroy === 'function') {
              swiper.destroy(true, false); // destroy(true, false) - destroy but keep DOM
            }
            
            // Remove from instances map
            swiperInstances.delete(container);
            
            // Allow re-initialization by resetting attributes
            container.removeAttribute('data-destroy-observed');
            container.removeAttribute('data-swiper-initialized');
            
            // Re-observe for initialization when it comes back into view
            if ((container as any).__swiperObserver) {
              (container as any).__swiperObserver.observe(container);
            }
            
            // Unobserve from destroy observer
            if (globalDestroyObserver) {
              globalDestroyObserver.unobserve(container);
            }
          } catch (e) {
            // Silently handle destroy errors
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0
    });
  }
  
  // Observe the newly added Swiper container
  swiperInstances.forEach((swiper, container) => {
    // Check if already observed
    if (!container.hasAttribute('data-destroy-observed')) {
      if (globalDestroyObserver) {
        globalDestroyObserver.observe(container);
        container.setAttribute('data-destroy-observed', 'true');
      }
    }
  });
}

// OPTIMIZED: Lazy Swiper initialization with IntersectionObserver
export function initTestimonialsSwiper(): void {
  const swiperContainer = document.querySelector('.testimonials-swiper') as HTMLElement;
  if (!swiperContainer) {
    return;
  }
  
  // Check if Swiper is already available
  // TYPESCRIPT: Use type-safe check instead of (window as any)
  if (!isSwiperAvailable()) {
    // Swiper not loaded - try to load it
    loadSwiperLibrary(
      () => {
        // Swiper loaded successfully - retry initialization
        setTimeout(() => {
          initTestimonialsSwiper();
        }, 100);
      }
    );
    return;
  }
  
  // Find parent section for viewport detection
  const section = swiperContainer.closest('section') || swiperContainer.parentElement;
  if (!section) {
    // Initialize immediately if no section found
    // TYPESCRIPT: Use type-safe check instead of (window as any)
  if (!isSwiperAvailable()) {
      loadSwiperLibrary(() => {
        createTestimonialsSwiper(swiperContainer);
      });
    } else {
      createTestimonialsSwiper(swiperContainer);
    }
    return;
  }
  
  // Mark container for lazy initialization
  swiperContainer.setAttribute('data-swiper-lazy', 'true');
  swiperContainer.setAttribute('data-swiper-type', 'testimonials');
  
  // Use IntersectionObserver for lazy initialization
  const swiperObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target as HTMLElement;
        const swiperType = container.getAttribute('data-swiper-type');
        
        // Initialize Swiper when section enters viewport
        // TYPESCRIPT: Use type-safe check instead of (window as any)
  if (!isSwiperAvailable()) {
          loadSwiperLibrary(() => {
            if (swiperType === 'testimonials') {
              createTestimonialsSwiper(container);
            }
          });
        } else {
          if (swiperType === 'testimonials') {
            createTestimonialsSwiper(container);
          }
        }
        
        // Unobserve after initialization
        swiperObserver.unobserve(container);
      }
    });
  }, { 
    rootMargin: '200px', // Pre-load 200px before viewport
    threshold: 0.01 
  });
  
  swiperObserver.observe(swiperContainer);
  
  // Store observer for cleanup
  (swiperContainer as any).__swiperObserver = swiperObserver;
}

function createTestimonialsSwiper(swiperContainer: HTMLElement): void {
  // Check if already initialized
  if (swiperInstances.has(swiperContainer)) {
    return;
  }
  
  const Swiper = (window as any).Swiper;
  if (!Swiper) {
    // Swiper not available - wait and retry
    console.warn('[Swiper] Library not available in createTestimonialsSwiper - retrying...');
    setTimeout(() => {
      // TYPESCRIPT: Use type-safe check
    if (isSwiperAvailable()) {
        createTestimonialsSwiper(swiperContainer);
      }
    }, 500);
    return;
  }
  
  const swiper = new Swiper(swiperContainer, createSwiperConfig({
    container: '.testimonials-swiper',
    pagination: '.testimonial-pagination',
    autoplayDelay: 5000
  }));
  
  // Store instance for destroy management
  swiperInstances.set(swiperContainer, swiper);
  
  // MOBILE FIX: Update Swiper after initialization to fix sizing issues
  requestAnimationFrame(() => {
    if (swiper && typeof swiper.update === 'function') {
      swiper.update();
      swiper.updateSize();
      swiper.updateSlides();
      swiper.updateSlidesClasses();
    }
  });
  
  // MOBILE FIX: Update Swiper after images are loaded
  const images = swiperContainer.querySelectorAll('img');
  if (images.length > 0) {
    let loadedCount = 0;
    const totalImages = images.length;
    
    images.forEach((img) => {
      if (img.complete) {
        loadedCount++;
      } else {
        img.addEventListener('load', () => {
          loadedCount++;
          if (loadedCount === totalImages && swiper && typeof swiper.update === 'function') {
            requestAnimationFrame(() => {
              swiper.update();
              swiper.updateSize();
              swiper.updateSlides();
              swiper.updateSlidesClasses();
            });
          }
        }, { once: true });
      }
    });
    
    // If all images are already loaded
    if (loadedCount === totalImages && swiper && typeof swiper.update === 'function') {
      requestAnimationFrame(() => {
        swiper.update();
        swiper.updateSize();
        swiper.updateSlides();
        swiper.updateSlidesClasses();
      });
    }
  }
  
  // Setup destroy observer for this Swiper
  setupSwiperDestroyObserver();
  
  const wrapper = swiperContainer.querySelector('.swiper-wrapper') as HTMLElement;
  const slides = wrapper?.querySelectorAll('.swiper-slide');
  
  if (wrapper && slides) {
    setupSwiperNavigation(swiperContainer, wrapper, slides, null, null);
  }
  
  // MOBILE FIX: Optimize touch handling
  let touchStartY = 0;
  let isScrolling = false;
  
  createEventListener(wrapper, 'touchstart', (e: TouchEvent) => {
    touchStartY = e.touches[0].clientY;
    isScrolling = false;
  }, { passive: true });
  
  // MOBILE FIX: Better touch move handling
  createEventListener(wrapper, 'touchmove', (e: TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const deltaY = Math.abs(touchY - touchStartY);
    
    // If vertical scroll is significant, allow page scroll
    if (deltaY > 10 && !isScrolling) {
      isScrolling = true;
    }
  }, { passive: true });
  
  // MOBILE FIX: Update Swiper on resize
  let resizeTimeout: number;
  createEventListener(window, 'resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      if (swiper && typeof swiper.update === 'function') {
        swiper.update();
        swiper.updateSize();
        swiper.updateSlides();
      }
    }, 150);
  }, { passive: true });
  
  // CRITICAL FIX: Pause all videos except active slide on slide change
  // This prevents multiple videos playing and improves performance
  if (swiper && typeof swiper.on === 'function') {
    swiper.on('slideChangeTransitionEnd', function() {
      try {
        // Pause all videos in testimonials swiper
        const allVideos = swiperContainer.querySelectorAll('video') as NodeListOf<HTMLVideoElement>;
        const activeSlide = swiperContainer.querySelector('.swiper-slide-active');
        
        allVideos.forEach(video => {
          const videoSlide = video.closest('.swiper-slide');
          // Pause video if it's not in the active slide
          if (videoSlide && videoSlide !== activeSlide) {
            if (!video.paused) {
              video.pause();
              video.currentTime = 0; // Reset to start for better UX
            }
          }
        });
        
        // Video management handled above
      } catch (e) {
        // Graceful degradation
      }
    });
    
    // Also pause videos on slide change start (before transition)
    swiper.on('slideChange', function() {
      try {
        const allVideos = swiperContainer.querySelectorAll('video') as NodeListOf<HTMLVideoElement>;
        allVideos.forEach(video => {
          if (!video.paused) {
            video.pause();
          }
        });
      } catch (e) {
        // Graceful degradation
      }
    });
  }
}


// OPTIMIZED: Lazy Swiper initialization with IntersectionObserver
export function initStudentModelsSwiper(): void {
  const swiperContainer = document.querySelector('.student-models-swiper') as HTMLElement;
  if (!swiperContainer) {
    return;
  }
  
  // Check if Swiper is already available
  // TYPESCRIPT: Use type-safe check instead of (window as any)
  if (!isSwiperAvailable()) {
    // Swiper not loaded - try to load it
    loadSwiperLibrary(
      () => {
        // Swiper loaded successfully - retry initialization
        setTimeout(() => {
          initStudentModelsSwiper();
        }, 100);
      }
    );
    return;
  }
  
  // Find parent section for viewport detection
  const section = swiperContainer.closest('section') || swiperContainer.parentElement;
  if (!section) {
    // Initialize immediately if no section found
    // TYPESCRIPT: Use type-safe check instead of (window as any)
  if (!isSwiperAvailable()) {
      loadSwiperLibrary(() => {
        createStudentModelsSwiper(swiperContainer);
      });
    } else {
      createStudentModelsSwiper(swiperContainer);
    }
    return;
  }
  
  // Mark container for lazy initialization
  swiperContainer.setAttribute('data-swiper-lazy', 'true');
  swiperContainer.setAttribute('data-swiper-type', 'models');
  
  // Use IntersectionObserver for lazy initialization
  const swiperObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target as HTMLElement;
        const swiperType = container.getAttribute('data-swiper-type');
        
        // Initialize Swiper when section enters viewport
        // TYPESCRIPT: Use type-safe check instead of (window as any)
  if (!isSwiperAvailable()) {
          loadSwiperLibrary(() => {
            if (swiperType === 'models') {
              createStudentModelsSwiper(container);
            }
          });
        } else {
          if (swiperType === 'models') {
            createStudentModelsSwiper(container);
          }
        }
        
        // Unobserve after initialization
        swiperObserver.unobserve(container);
      }
    });
  }, { 
    rootMargin: '200px', // Pre-load 200px before viewport
    threshold: 0.01 
  });
  
  swiperObserver.observe(swiperContainer);
  
  // Store observer for cleanup
  (swiperContainer as any).__swiperObserver = swiperObserver;
}

function createStudentModelsSwiper(swiperContainer: HTMLElement): void {
  // Check if already initialized
  if (swiperInstances.has(swiperContainer)) {
    return;
  }
  
  const Swiper = (window as any).Swiper;
  if (!Swiper) {
    // Swiper not available - wait and retry
    console.warn('[Swiper] Library not available in createStudentModelsSwiper - retrying...');
    setTimeout(() => {
      // TYPESCRIPT: Use type-safe check
    if (isSwiperAvailable()) {
        createStudentModelsSwiper(swiperContainer);
      }
    }, 500);
    return;
  }
  
  const swiper = new Swiper(swiperContainer, createSwiperConfig({
    container: '.student-models-swiper',
    pagination: '.model-pagination',
    autoplayDelay: 4000
  }));
  
  // Store instance for destroy management
  swiperInstances.set(swiperContainer, swiper);
  
  // Setup destroy observer for this Swiper
  setupSwiperDestroyObserver();
  
  const wrapper = swiperContainer.querySelector('.swiper-wrapper') as HTMLElement;
  const slides = wrapper?.querySelectorAll('.swiper-slide');
  
  if (wrapper && slides) {
    setupSwiperNavigation(swiperContainer, wrapper, slides, null, null);
  }
  
  swiperContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('.swiper-button-prev, .swiper-button-next');
    if (button) return;
    
    const imageWrapper = target.closest('.model-image-wrapper');
    if (!imageWrapper) return;
    
    const img = imageWrapper.querySelector('.model-photo') as HTMLImageElement;
    if (img?.src) {
      const modal = document.getElementById('photoModal');
      if (modal) {
        const modalImg = modal.querySelector('.modal-image') as HTMLImageElement;
        if (modalImg) {
          modalImg.src = img.src;
          modalImg.alt = img.alt || 'Модель ученика';
          (modal as HTMLElement).style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      }
    }
  });
  
  let touchStartY = 0;
  wrapper.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    if (window.scrollY === 0) {
      scheduleRAF(() => {
        window.scrollTo(0, 1);
      });
    }
  }, { passive: true });
  
  // OPTIMIZED: touchmove with stopPropagation can use passive: true (no preventDefault)
  // MEMORY MANAGEMENT: Register cleanup for touch listeners
  createEventListener(wrapper, 'touchmove', (e: TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const deltaY = Math.abs(touchY - touchStartY);
    if (deltaY > 10) {
      e.stopPropagation();
    }
  }, { passive: true });
}


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
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(ensureDocumentIsScrollable, 150);
  }, { passive: true });
  
  // TYPESCRIPT: Use type-safe access to Telegram WebApp
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.disableVerticalSwipes?.();
      tg.expand?.();
    } catch (e) {}
    
    document.addEventListener('touchstart', preventTelegramCollapse, { passive: true });
  }
}


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


export function initLazyLoading(): void {
  // DRY: Use shared utility function instead of duplicating lazy image loading logic
  initLazyImagesUtil('img[loading="lazy"], img.lazy-image', '200px');
}


export function initPhotoModal(): void {
  // ERROR HANDLING: Use safe DOM access with graceful degradation
  const modal = safeGetElementById<HTMLElement>('photoModal');
  if (!modal) return;
  
  const modalImg = modal.querySelector('.modal-image') as HTMLImageElement;
  const closeBtn = modal.querySelector('.modal-close') as HTMLElement;
  
  let isModalOpen = false;
  
  function openModal(imgSrc: string, imgAlt: string): void {
    if (!modal || !modalImg || isModalOpen) return;
    try {
      modalImg.src = imgSrc;
      modalImg.alt = imgAlt;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      isModalOpen = true;
      
      // CRITICAL FIX: Ensure testimonials swiper remains visible when modal opens
      const testimonialsSwiper = document.querySelector('.testimonials-swiper') as HTMLElement;
      if (testimonialsSwiper) {
        testimonialsSwiper.style.display = 'block';
        testimonialsSwiper.style.visibility = 'visible';
        testimonialsSwiper.style.opacity = '1';
      }
    } catch (e) {
      // Graceful degradation: silently fail
    }
  }
  
  function closeModal(): void {
    if (!modal || !isModalOpen) return;
    try {
      // CLS FIX: Use requestAnimationFrame to prevent layout shifts
      requestAnimationFrame(() => {
        modal.style.display = 'none';
        if (modalImg) modalImg.src = '';
        document.body.style.overflow = '';
        isModalOpen = false;
      });
    } catch (e) {
      // Graceful degradation: silently fail
    }
  }
  
  if (closeBtn) {
    const handleCloseClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closeModal();
      return false;
    };
    
    // MEMORY MANAGEMENT: Register cleanup for event listeners
    createEventListener(closeBtn, 'click', handleCloseClick, { capture: true, passive: false });
    createEventListener(closeBtn, 'touchend', handleCloseClick, { capture: true, passive: false });
    
    if ('ontouchstart' in window === false) {
      createEventListener(closeBtn, 'mousedown', (e) => {
        e.stopPropagation();
      }, { capture: true });
    }
  }
  
  // MEMORY MANAGEMENT: Register cleanup for modal click listener
  createEventListener(modal, 'click', (e) => {
    const target = e.target as HTMLElement;
    if (target === modal && isModalOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    }
  }, { passive: false });
  
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // CRITICAL FIX: Ignore clicks on video elements and their controls
    if (target.tagName === 'VIDEO' || 
        target.closest('video') || 
        target.classList.contains('slider-video') ||
        target.closest('.slider-video') ||
        target.closest('video::-webkit-media-controls') ||
        target.closest('.video-item')) {
      // Allow video controls to work normally - don't open modal
      return;
    }
    
    const sliderContainer = target.closest('.slider-image-container');
    if (sliderContainer) {
      // CRITICAL FIX: Don't open modal if clicking on video inside container
      const video = sliderContainer.querySelector('.slider-video, video');
      if (video && (target === video || target.closest('video'))) {
        return; // Let video controls work
      }
      
      const img = sliderContainer.querySelector('.slider-photo') as HTMLImageElement;
      if (img?.src && !isModalOpen) {
        e.preventDefault();
        e.stopPropagation();
        openModal(img.src, img.alt || 'Фото отзыва');
        return;
      }
    }
    
    const testimonialContainer = target.closest('.testimonial-image-container');
    if (testimonialContainer) {
      const img = testimonialContainer.querySelector('.testimonial-photo') as HTMLImageElement;
      if (img?.src && !isModalOpen) {
        e.preventDefault();
        e.stopPropagation();
        openModal(img.src, img.alt || 'Фото отзыва');
        return;
      }
    }
    
    const modelWrapper = target.closest('.model-image-wrapper');
    if (modelWrapper) {
      const img = modelWrapper.querySelector('.model-photo') as HTMLImageElement;
      if (img?.src && !isModalOpen) {
        e.preventDefault();
        e.stopPropagation();
        openModal(img.src, img.alt || 'Модель ученика');
        return;
      }
    }
  }, { passive: false });
  
  // MEMORY MANAGEMENT: Register cleanup for keydown listener
  createEventListener(document, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isModalOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    }
  }, { passive: false });
  
  (window as any).closePhotoModal = closeModal;
  (window as any).isPhotoModalOpen = () => isModalOpen;
}


function scrollToElement(targetId: string): void {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;
  
  const mainContentEl = document.getElementById('main-content') || document.querySelector('main');
  const targetRect = targetElement.getBoundingClientRect();
  const viewportHeight = mainContentEl ? (mainContentEl as HTMLElement).clientHeight : window.innerHeight;
  const offset = viewportHeight * 0.2;
  
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
  window.addEventListener('hashchange', () => {
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
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[data-scroll-to], a[href^="#"]') as HTMLAnchorElement;
    if (!link) return;
    
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
  });
}


// Tariff data configuration
interface TariffData {
  name: string;
  rub: {
    amount: string;
    url: string;
  };
  eur: {
    amount: string;
    url: string;
  };
}

const TARIFFS: Record<string, TariffData> = {
  '1': {
    name: 'Самостоятельный',
    rub: {
      amount: '24.000 ₽',
      url: 'https://t.me/tribute/app?startapp=sFEK'
    },
    eur: {
      amount: '250 €',
      url: 'https://t.me/tribute/app?startapp=sFEc'
    }
  },
  '2': {
    name: 'Все и сразу',
    rub: {
      amount: '46 800 ₽',
      url: 'https://t.me/tribute/app?startapp=sKRN'
    },
    eur: {
      amount: '500 €',
      url: 'https://t.me/tribute/app?startapp=sKRL'
    }
  }
};

// Global reference to openOfferModal function (will be set by initOfferModal)
let openOfferModalGlobal: ((tariffId: string, currency: 'rub' | 'eur', paymentUrl: string) => void) | null = null;

export function initCurrencyModal(): void {
  const modal = document.getElementById('currencyModal') as HTMLElement;
  if (!modal) return;
  
  const backdrop = modal.querySelector('.currency-modal-backdrop') as HTMLElement;
  const closeBtn = modal.querySelector('.currency-modal-close') as HTMLElement;
  const rubBtn = modal.querySelector('.currency-btn-rub') as HTMLAnchorElement;
  const eurBtn = modal.querySelector('.currency-btn-eur') as HTMLAnchorElement;
  const cryptoBtn = modal.querySelector('#currencyCryptoBtn') as HTMLAnchorElement;
  const rubAmount = modal.querySelector('#currencyRubAmount') as HTMLElement;
  const eurAmount = modal.querySelector('#currencyEurAmount') as HTMLElement;
  const supportBtn = modal.querySelector('#currencySupportLink') as HTMLAnchorElement;
  
  let isModalOpen = false;
  let currentTariff: string | null = null;
  
  // Support link for tariffs 1 and 2 (also used for crypto payment)
  const supportLink = 'https://t.me/illariooo';
  
  function openModal(tariffId: string): void {
    if (isModalOpen || !TARIFFS[tariffId]) return;
    
    currentTariff = tariffId;
    const tariff = TARIFFS[tariffId];
    
    // INP OPTIMIZATION: Critical operations first - show modal immediately
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    isModalOpen = true;
    
    // INP OPTIMIZATION: Batch DOM updates in RAF
    scheduleRAF(() => {
      // Update amounts (critical for user feedback)
      if (rubAmount) rubAmount.textContent = tariff.rub.amount;
      if (eurAmount) eurAmount.textContent = tariff.eur.amount;
      
      // Update links (critical for functionality)
      if (rubBtn) rubBtn.href = tariff.rub.url;
      if (eurBtn) eurBtn.href = tariff.eur.url;
      
      // Update crypto payment link (leads to personal Telegram)
      if (cryptoBtn) {
        cryptoBtn.href = supportLink;
      }
      
      // Update support link for tariffs 1 and 2
      if (supportBtn && (tariffId === '1' || tariffId === '2')) {
        supportBtn.href = supportLink;
      }
      
      // Trigger animation
      modal.classList.add('is-open');
      backdrop?.classList.add('is-active');
    });
    
    // HAPTIC FIX: Use global triggerHaptic function if available
    if (typeof (window as any).triggerAppHaptic === 'function') {
      (window as any).triggerAppHaptic('light');
    } else if (typeof (window as any).triggerHaptic === 'function') {
      (window as any).triggerHaptic('light');
    } else {
      // Fallback: direct haptic access
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  }
  
  function closeModal(): void {
    if (!isModalOpen) return;
    
    // Remove animation classes
    modal.classList.remove('is-open');
    backdrop?.classList.remove('is-active');
    
    // Hide after animation
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      isModalOpen = false;
      currentTariff = null;
    }, 200);
    
    // Haptic feedback
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  }
  
  // Close button handler
  if (closeBtn) {
    const handleClose = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    };
    
    closeBtn.addEventListener('click', handleClose, { passive: false });
    closeBtn.addEventListener('touchend', handleClose, { passive: false });
  }
  
  // Backdrop click handler
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        e.preventDefault();
        closeModal();
      }
    }, { passive: false });
  }
  
  // Close on Escape key
  // MEMORY MANAGEMENT: Register cleanup for keydown listener
  createEventListener(document, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isModalOpen) {
      e.preventDefault();
      closeModal();
    }
  }, { passive: false });
  
  // Handle tariff button clicks
  // INP OPTIMIZATION: Use optimized click handler
  const tariffButtons = document.querySelectorAll('[data-tariff]');
  tariffButtons.forEach(btn => {
    // INP OPTIMIZATION: Extract tariffId once, not in handler
    const tariffId = (btn as HTMLElement).dataset.tariff;
    if (!tariffId) return;
    
    // INP OPTIMIZATION: Minimal handler - only preventDefault and call openModal
    const handleClick = (e: Event) => {
      e.preventDefault();
      // INP OPTIMIZATION: Use requestAnimationFrame to defer openModal
      // This allows browser to process the click event faster
      requestAnimationFrame(() => {
        openModal(tariffId);
      });
    };
    
    btn.addEventListener('click', handleClick, { passive: false });
  });
  
  // Currency button click handlers - теперь открывают модальное окно оферты
  if (rubBtn) {
    const handleRubClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!currentTariff) return;
      
      const tariff = TARIFFS[currentTariff];
      if (!tariff) return;
      
      // Haptic feedback
      if (typeof (window as any).triggerAppHaptic === 'function') {
        (window as any).triggerAppHaptic('medium');
      } else if (typeof (window as any).triggerHaptic === 'function') {
        (window as any).triggerHaptic('medium');
      } else if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
      
      // Сохраняем значения перед закрытием модального окна
      const tariffId = currentTariff;
      const paymentUrl = tariff.rub.url;
      
      // Закрываем модальное окно выбора валюты
      closeModal();
      
      // Открываем модальное окно оферты
      requestAnimationFrame(() => {
        if (openOfferModalGlobal && tariffId) {
          openOfferModalGlobal(tariffId, 'rub', paymentUrl);
        } else {
          // Fallback: если модальное окно оферты еще не инициализировано, используем прямой переход
          console.warn('Offer modal not initialized, redirecting directly');
          window.location.href = paymentUrl;
        }
      });
    };
    
    rubBtn.addEventListener('click', handleRubClick, { passive: false });
  }
  
  if (eurBtn) {
    const handleEurClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!currentTariff) return;
      
      const tariff = TARIFFS[currentTariff];
      if (!tariff) return;
      
      // Haptic feedback
      if (typeof (window as any).triggerAppHaptic === 'function') {
        (window as any).triggerAppHaptic('medium');
      } else if (typeof (window as any).triggerHaptic === 'function') {
        (window as any).triggerHaptic('medium');
      } else if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
      
      // Сохраняем значения перед закрытием модального окна
      const tariffId = currentTariff;
      const paymentUrl = tariff.eur.url;
      
      // Закрываем модальное окно выбора валюты
      closeModal();
      
      // Открываем модальное окно оферты
      requestAnimationFrame(() => {
        if (openOfferModalGlobal && tariffId) {
          openOfferModalGlobal(tariffId, 'eur', paymentUrl);
        } else {
          // Fallback: если модальное окно оферты еще не инициализировано, используем прямой переход
          console.warn('Offer modal not initialized, redirecting directly');
          window.location.href = paymentUrl;
        }
      });
    };
    
    createEventListener(eurBtn, 'click', handleEurClick, { passive: false });
  }
  
  // Expose functions globally for Telegram WebApp BackButton
  // TYPESCRIPT: Use type-safe window extensions (defined in types.ts)
  window.closeCurrencyModal = closeModal;
  window.isCurrencyModalOpen = () => isModalOpen;
}

/**
 * Initialize Offer Confirmation Modal
 * Handles the offer agreement and customer data collection before payment
 */
export function initOfferModal(): void {
  const modal = document.getElementById('offerModal') as HTMLElement;
  if (!modal) return;
  
  const backdrop = modal.querySelector('.offer-modal-backdrop') as HTMLElement;
  const closeBtn = modal.querySelector('.offer-modal-close') as HTMLElement;
  const form = modal.querySelector('#offerForm') as HTMLFormElement;
  const firstNameInput = modal.querySelector('#offerFirstName') as HTMLInputElement;
  const lastNameInput = modal.querySelector('#offerLastName') as HTMLInputElement;
  const emailInput = modal.querySelector('#offerEmail') as HTMLInputElement;
  const privacyCheckbox = modal.querySelector('#offerPrivacy') as HTMLInputElement;
  const agreementCheckbox = modal.querySelector('#offerAgreement') as HTMLInputElement;
  const submitBtn = modal.querySelector('#offerSubmitBtn') as HTMLButtonElement;
  
  let isModalOpen = false;
  let currentTariffId: string | null = null;
  let currentCurrency: 'rub' | 'eur' | null = null;
  let currentPaymentUrl: string | null = null;
  let isSubmitting = false;
  const PREFILL_STORAGE_KEY = 'offerFormPrefill';
  
  // Текст оферты (пользователь должен предоставить актуальный текст)
  const OFFER_TEXT = `ПУБЛИЧНАЯ ОФЕРТА

Настоящая публичная оферта (далее — «Оферта») является официальным предложением об оказании информационно-консультационных услуг.

1. ОБЩИЕ ПОЛОЖЕНИЯ
1.1. Настоящая Оферта определяет условия оказания информационно-консультационных услуг.
1.2. Акцептом настоящей Оферты является совершение действий по оплате услуг.
1.3. Исполнитель вправе в любое время изменить условия настоящей Оферты.

2. ПРЕДМЕТ ОФЕРТЫ
2.1. Исполнитель обязуется предоставить Заказчику информационно-консультационные услуги в соответствии с выбранным тарифом.
2.2. Услуги предоставляются в электронном виде через платформу Telegram.

3. СТОИМОСТЬ И ПОРЯДОК ОПЛАТЫ
3.1. Стоимость услуг указана на сайте и может изменяться без предварительного уведомления.
3.2. Оплата производится единовременно в полном объеме до начала оказания услуг.
3.3. Возврат средств возможен в соответствии с законодательством РФ.

4. ПРАВА И ОБЯЗАННОСТИ СТОРОН
4.1. Заказчик обязуется предоставить достоверную информацию при регистрации.
4.2. Исполнитель обязуется предоставить услуги в соответствии с условиями Оферты.

5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ
5.1. Настоящая Оферта вступает в силу с момента акцепта Заказчиком.
5.2. Все споры решаются путем переговоров, а при невозможности — в судебном порядке.`;

  function getPrefillData(): { firstName?: string; lastName?: string; email?: string } | null {
    try {
      const raw = localStorage.getItem(PREFILL_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        firstName: typeof parsed.firstName === 'string' ? parsed.firstName : '',
        lastName: typeof parsed.lastName === 'string' ? parsed.lastName : '',
        email: typeof parsed.email === 'string' ? parsed.email : ''
      };
    } catch (e) {
      return null;
    }
  }

  function setPrefillData(data: { firstName: string; lastName: string; email: string }): void {
    try {
      localStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Ignore storage errors (private mode, etc.)
    }
  }

  function applyPrefill(): void {
    const data = getPrefillData();
    if (!data) return;
    if (firstNameInput && !firstNameInput.value) {
      firstNameInput.value = data.firstName || '';
    }
    if (lastNameInput && !lastNameInput.value) {
      lastNameInput.value = data.lastName || '';
    }
    if (emailInput && !emailInput.value) {
      emailInput.value = data.email || '';
    }
    updateSubmitButton();
  }

  function storePrefillFromInputs(): void {
    const firstName = firstNameInput?.value.trim() || '';
    const lastName = lastNameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    if (!firstName && !lastName && !email) return;
    setPrefillData({ firstName, lastName, email });
  }

  function openOfferModal(tariffId: string, currency: 'rub' | 'eur', paymentUrl: string): void {
    if (isModalOpen || !TARIFFS[tariffId]) return;
    
    currentTariffId = tariffId;
    currentCurrency = currency;
    currentPaymentUrl = paymentUrl;
    isSubmitting = false;
    
    // Показываем модальное окно сразу для предотвращения мерцания
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    isModalOpen = true;
    
    // Используем двойной RAF для оптимизации: первый для DOM операций, второй для анимации
    requestAnimationFrame(() => {
      // Сброс формы в первом RAF
      if (form) {
        form.reset();
        clearErrors();
        applyPrefill();
        updateSubmitButton();
      }
      
      // Анимация во втором RAF для плавности
      requestAnimationFrame(() => {
        modal.classList.add('is-open');
        backdrop?.classList.add('is-active');
      });
    });
    
    // Haptic feedback (отложенный для оптимизации)
    requestAnimationFrame(() => {
      if (typeof (window as any).triggerAppHaptic === 'function') {
        (window as any).triggerAppHaptic('light');
      } else if (typeof (window as any).triggerHaptic === 'function') {
        (window as any).triggerHaptic('light');
      } else if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    });
  }
  
  function closeOfferModal(): void {
    if (!isModalOpen) return;
    
    modal.classList.remove('is-open');
    backdrop?.classList.remove('is-active');
    
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      isModalOpen = false;
      currentTariffId = null;
      currentCurrency = null;
      currentPaymentUrl = null;
      
      // Сброс формы
      if (form) {
        form.reset();
        clearErrors();
        updateSubmitButton();
      }
    }, 200);
    
    // Haptic feedback
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  }
  
  function clearErrors(): void {
    const errorElements = modal.querySelectorAll('.form-error');
    errorElements.forEach(el => {
      (el as HTMLElement).textContent = '';
    });
    
    const inputs = modal.querySelectorAll('.form-input, .form-checkbox');
    inputs.forEach(input => {
      (input as HTMLElement).setAttribute('aria-invalid', 'false');
    });
  }
  
  function showError(input: HTMLInputElement, message: string): void {
    const fieldName = input.name;
    const errorEl = modal.querySelector(`#${fieldName}Error`) as HTMLElement;
    if (errorEl) {
      errorEl.textContent = message;
    }
    input.setAttribute('aria-invalid', 'true');
  }
  
  function validateForm(): boolean {
    clearErrors();
    let isValid = true;
    
    // Валидация имени
    if (!firstNameInput || !firstNameInput.value.trim()) {
      if (firstNameInput) {
        showError(firstNameInput, 'Пожалуйста, введите имя');
      }
      isValid = false;
    }
    
    // Валидация фамилии
    if (!lastNameInput || !lastNameInput.value.trim()) {
      if (lastNameInput) {
        showError(lastNameInput, 'Пожалуйста, введите фамилию');
      }
      isValid = false;
    }
    
    // Валидация email
    if (!emailInput || !emailInput.value.trim()) {
      if (emailInput) {
        showError(emailInput, 'Пожалуйста, введите email');
      }
      isValid = false;
    } else if (emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
      showError(emailInput, 'Пожалуйста, введите корректный email');
      isValid = false;
    }
    
    // Валидация чекбокса согласия
    if (!agreementCheckbox || !agreementCheckbox.checked) {
      if (agreementCheckbox) {
        const errorEl = modal.querySelector('#agreementError') as HTMLElement;
        if (errorEl) {
          errorEl.textContent = 'Необходимо согласиться с условиями оферты';
        }
        agreementCheckbox.setAttribute('aria-invalid', 'true');
      }
      isValid = false;
    }
    
    return isValid;
  }
  
  function updateSubmitButton(): void {
    if (!submitBtn) return;
    
    const hasFirstName = firstNameInput && firstNameInput.value.trim().length > 0;
    const hasLastName = lastNameInput && lastNameInput.value.trim().length > 0;
    const hasEmail = emailInput && emailInput.value.trim().length > 0;
    const hasPrivacy = privacyCheckbox && privacyCheckbox.checked;
    const hasAgreement = agreementCheckbox && agreementCheckbox.checked;
    
    submitBtn.disabled = !(hasFirstName && hasLastName && hasEmail && hasPrivacy && hasAgreement) || isSubmitting;
  }
  
  async function saveUserData(data: {
    firstName: string;
    lastName: string;
    email: string;
    tariffId: string;
    tariffName: string;
    currency: string;
    paymentUrl: string;
    timestamp: string;
  }): Promise<void> {
    // Получаем API endpoint из переменных окружения или используем значение по умолчанию
    const API_ENDPOINT = (import.meta.env.PUBLIC_API_ENDPOINT as string) || '/api/offer-confirmation';
    
    // Определяем payment_type на основе валюты и тарифа
    // Для основного процесса оплаты используем формат: tariff_{tariffId}_{currency}
    const paymentType = `tariff_${data.tariffId}_${data.currency}`;
    
    // Сохранение в localStorage (fallback)
    try {
      const savedData = JSON.parse(localStorage.getItem('offerConfirmations') || '[]');
      savedData.push(data);
      localStorage.setItem('offerConfirmations', JSON.stringify(savedData));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    
    // Отправка на API сервер (с интеграциями: Google Sheets, Email, Webhook)
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          payment_type: paymentType,
          additional_data: {
            tariff_id: data.tariffId,
            tariff_name: data.tariffName,
            currency: data.currency,
            payment_url: data.paymentUrl,
            timestamp: data.timestamp
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
        console.warn('Failed to save to API:', errorData.detail || 'Unknown error');
        // Не прерываем процесс, просто логируем ошибку
      } else {
        const result = await response.json();
        console.log('Data saved to API successfully:', result);
      }
    } catch (error) {
      console.error('Error sending data to API:', error);
      // Не прерываем процесс, просто логируем ошибку
    }
  }
  
  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;
    
    if (!validateForm()) {
      // Haptic feedback для ошибки
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
      return;
    }
    
    if (!currentTariffId || !currentCurrency || !currentPaymentUrl) {
      console.error('Missing payment data');
      return;
    }
    
    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Обработка...';
    }
    
    // Haptic feedback
    if (typeof (window as any).triggerAppHaptic === 'function') {
      (window as any).triggerAppHaptic('medium');
    } else if (typeof (window as any).triggerHaptic === 'function') {
      (window as any).triggerHaptic('medium');
    } else if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    
    try {
      const tariff = TARIFFS[currentTariffId];
      storePrefillFromInputs();
      
      // Сохранение данных
      await saveUserData({
        firstName: firstNameInput?.value.trim() || '',
        lastName: lastNameInput?.value.trim() || '',
        email: emailInput?.value.trim() || '',
        tariffId: currentTariffId,
        tariffName: tariff?.name || '',
        currency: currentCurrency,
        paymentUrl: currentPaymentUrl,
        timestamp: new Date().toISOString()
      });
      
      // Редирект на Tribute
      window.location.href = currentPaymentUrl;
    } catch (error) {
      console.error('Error saving user data:', error);
      // Даже при ошибке сохранения разрешаем переход к оплате
      window.location.href = currentPaymentUrl;
    }
  }
  
  // Event listeners
  if (closeBtn) {
    const handleClose = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      closeOfferModal();
    };
    
    closeBtn.addEventListener('click', handleClose, { passive: false });
    closeBtn.addEventListener('touchend', handleClose, { passive: false });
  }
  
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        e.preventDefault();
        closeOfferModal();
      }
    }, { passive: false });
  }
  
  // Close on Escape key
  createEventListener(document, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isModalOpen) {
      e.preventDefault();
      closeOfferModal();
    }
  }, { passive: false });
  
  // Form validation on input
  if (firstNameInput) {
    createEventListener(firstNameInput, 'input', () => {
      if (firstNameInput.value.trim()) {
        const errorEl = modal.querySelector('#firstNameError') as HTMLElement;
        if (errorEl) errorEl.textContent = '';
        firstNameInput.setAttribute('aria-invalid', 'false');
      }
      storePrefillFromInputs();
      updateSubmitButton();
    });
  }
  
  if (lastNameInput) {
    createEventListener(lastNameInput, 'input', () => {
      if (lastNameInput.value.trim()) {
        const errorEl = modal.querySelector('#lastNameError') as HTMLElement;
        if (errorEl) errorEl.textContent = '';
        lastNameInput.setAttribute('aria-invalid', 'false');
      }
      storePrefillFromInputs();
      updateSubmitButton();
    });
  }
  
  if (emailInput) {
    createEventListener(emailInput, 'input', () => {
      if (emailInput.value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
        const errorEl = modal.querySelector('#emailError') as HTMLElement;
        if (errorEl) errorEl.textContent = '';
        emailInput.setAttribute('aria-invalid', 'false');
      }
      storePrefillFromInputs();
      updateSubmitButton();
    });
  }
  
  if (privacyCheckbox) {
    createEventListener(privacyCheckbox, 'change', () => {
      if (privacyCheckbox.checked) {
        const errorEl = modal.querySelector('#privacyError') as HTMLElement;
        if (errorEl) errorEl.textContent = '';
        privacyCheckbox.setAttribute('aria-invalid', 'false');
      }
      updateSubmitButton();
    });
  }
  
  if (agreementCheckbox) {
    createEventListener(agreementCheckbox, 'change', () => {
      if (agreementCheckbox.checked) {
        const errorEl = modal.querySelector('#agreementError') as HTMLElement;
        if (errorEl) errorEl.textContent = '';
        agreementCheckbox.setAttribute('aria-invalid', 'false');
      }
      updateSubmitButton();
    });
  }
  
  if (form) {
    form.addEventListener('submit', handleSubmit, { passive: false });
  }
  
  // Expose functions globally
  (window as any).openOfferModal = openOfferModal;
  (window as any).closeOfferModal = closeOfferModal;
  (window as any).isOfferModalOpen = () => isModalOpen;
  
  // Make openOfferModal available globally for initCurrencyModal
  openOfferModalGlobal = openOfferModal;
}


export function initHowItWorks(): void {
  onReady(() => {
    initRevealAnimations();
    initHorizontalCardReveal();
    initFAQ();
    initTestimonialsSwiper();
    initStudentModelsSwiper();
    initTelegramWebAppFixes();
    preventOrphans();
    initLazyLoading();
    initPhotoModal();
    initOfferModal(); // Инициализируем сначала, чтобы openOfferModalGlobal был доступен
    initCurrencyModal();
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

