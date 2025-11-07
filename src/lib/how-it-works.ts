/**
 * How It Works Page - Consolidated JavaScript Module
 * 
 * OPTIMIZED: All scroll/touch event listeners must use { passive: true } for better performance
 * This prevents blocking the main thread during scroll/touch events
 */

import { scheduleRAF } from './reveal';

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
        const card = entry.target as HTMLElement;
        const cardIndex = parseInt(card.dataset.step || '1') - 1;
        const stepContent = card.querySelector('.step-content') as HTMLElement;
        
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
                const prevContent = activeCard.querySelector('.step-content') as HTMLElement;
                if (prevContent) {
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
      card.style.pointerEvents = 'none';
    }
    observer.observe(card);
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  }, { passive: true });
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
      if (typeof (window as any).initReveal === 'function') {
        (window as any).initReveal();
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
    // OPTIMIZED: Disable watchOverflow if only 1-3 slides (most cases)
    watchOverflow: false,
    slidesPerView: 1,
    spaceBetween: 0,
    centeredSlides: true,
    cssMode: true,
    simulateTouch: false,
    allowTouchMove: true,
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
    // OPTIMIZED: Disable unnecessary watchers for better performance
    watchSlidesProgress: false,
    watchSlidesVisibility: false,
    // OPTIMIZED: Disable preload images - use lazy loading instead
    preloadImages: false,
    // OPTIMIZED: Enable lazy loading for images
    lazy: {
      loadPrevNext: true,
      loadPrevNextAmount: 1,
    },
    // OPTIMIZED: Disable MutationObserver if DOM doesn't change
    observer: false,
    observeParents: false,
    breakpoints: {
      320: { slidesPerView: 1, spaceBetween: 0, centeredSlides: true },
      768: { slidesPerView: 1, spaceBetween: 0, centeredSlides: true },
      1024: { slidesPerView: 1, spaceBetween: 0, centeredSlides: true },
    },
    on: {
      init: function(swiperInstance: any) {
        // Swiper initialized
      },
      paginationRender: function(swiperInstance: any) {
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

function loadSwiperLibrary(callback: () => void): void {
  if (typeof (window as any).Swiper !== 'undefined') {
    callback();
    return;
  }
  
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
  script.async = true; // Load asynchronously
  script.onload = callback;
  script.onerror = function() {
    // Swiper library failed to load
  };
  document.head.appendChild(script);
}


// Store Swiper instances for destroy management
const swiperInstances = new Map<HTMLElement, any>();

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
        
        // If Swiper is far above viewport (more than 1000px), destroy it
        if (!entry.isIntersecting && entry.boundingClientRect.top < -1000) {
          try {
            // Destroy Swiper instance to free memory and remove event listeners
            if (swiper.destroy && typeof swiper.destroy === 'function') {
              swiper.destroy(true, false); // destroy(true, false) - destroy but keep DOM
            }
            
            // Remove from instances map
            swiperInstances.delete(container);
            
            // Remove lazy attributes to allow re-initialization if needed
            container.removeAttribute('data-swiper-lazy');
            container.removeAttribute('data-swiper-type');
            
            // Unobserve this container
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
  
  // Find parent section for viewport detection
  const section = swiperContainer.closest('section') || swiperContainer.parentElement;
  if (!section) {
    // Fallback: initialize immediately if no section found
    loadSwiperLibrary(() => {
      createTestimonialsSwiper(swiperContainer);
    });
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
        loadSwiperLibrary(() => {
          if (swiperType === 'testimonials') {
            createTestimonialsSwiper(container);
          }
        });
        
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
    return;
  }
  
  const swiper = new Swiper(swiperContainer, createSwiperConfig({
    container: '.testimonials-swiper',
    pagination: '.testimonial-pagination',
    autoplayDelay: 5000
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
  
  let touchStartY = 0;
  wrapper.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    if (window.scrollY === 0) {
      scheduleRAF(() => {
        window.scrollTo(0, 1);
      });
    }
  }, { passive: true });
  
  wrapper.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const deltaY = Math.abs(touchY - touchStartY);
    if (deltaY > 10) {
      e.stopPropagation();
    }
  }, { passive: true });
}


// OPTIMIZED: Lazy Swiper initialization with IntersectionObserver
export function initStudentModelsSwiper(): void {
  const swiperContainer = document.querySelector('.student-models-swiper') as HTMLElement;
  if (!swiperContainer) {
    return;
  }
  
  // Find parent section for viewport detection
  const section = swiperContainer.closest('section') || swiperContainer.parentElement;
  if (!section) {
    // Fallback: initialize immediately if no section found
    loadSwiperLibrary(() => {
      createStudentModelsSwiper(swiperContainer);
    });
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
        loadSwiperLibrary(() => {
          if (swiperType === 'models') {
            createStudentModelsSwiper(container);
          }
        });
        
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
  
  wrapper.addEventListener('touchmove', (e) => {
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
  window.addEventListener('resize', ensureDocumentIsScrollable);
  
  if ((window as any).Telegram?.WebApp) {
    try {
      (window as any).Telegram.WebApp.disableVerticalSwipes();
      (window as any).Telegram.WebApp.expand();
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
  // Use same approach as first page - handle all lazy images
  const lazyImages = document.querySelectorAll('img[loading="lazy"], img.lazy-image');
  
  if (!lazyImages.length) return;
  
  if (typeof IntersectionObserver === 'undefined') {
    // Fallback: show all images immediately
    lazyImages.forEach(img => {
      (img as HTMLImageElement).classList.add('loaded');
    });
    return;
  }
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        
        // If image is already loaded, show it immediately
        if (img.complete && img.naturalHeight !== 0) {
          img.classList.add('loaded');
          observer.unobserve(img);
        } else {
          // Add loading state
          img.classList.add('loading');
          
          // Wait for image to load
          const handleLoad = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
            observer.unobserve(img);
          };
          
          const handleError = () => {
            // Handle error - still show image to prevent white space
            img.classList.remove('loading');
            img.classList.add('loaded');
            observer.unobserve(img);
          };
          
          img.addEventListener('load', handleLoad, { once: true });
          img.addEventListener('error', handleError, { once: true });
        }
      }
    });
  }, {
    root: null,
    rootMargin: '200px', // OPTIMIZED: Increased to 200px for better pre-loading (matches card reveal observer)
    threshold: 0.01
  });
  
  // Check initial viewport and observe remaining images
  lazyImages.forEach(img => {
    const imageElement = img as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 50 &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
    
    if (isInViewport && imageElement.complete && imageElement.naturalHeight !== 0) {
      // Already loaded and in viewport - show immediately
      imageElement.classList.add('loaded');
    } else {
      // Observe for lazy loading
      imageObserver.observe(img);
    }
  });
}


export function initPhotoModal(): void {
  const modal = document.getElementById('photoModal') as HTMLElement;
  if (!modal) return;
  
  const modalImg = modal.querySelector('.modal-image') as HTMLImageElement;
  const closeBtn = modal.querySelector('.modal-close') as HTMLElement;
  
  let isModalOpen = false;
  
  function openModal(imgSrc: string, imgAlt: string): void {
    if (modalImg && !isModalOpen) {
      modalImg.src = imgSrc;
      modalImg.alt = imgAlt;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      isModalOpen = true;
    }
  }
  
  function closeModal(): void {
    if (!isModalOpen) return;
    
    modal.style.display = 'none';
    if (modalImg) modalImg.src = '';
    document.body.style.overflow = '';
    isModalOpen = false;
  }
  
  if (closeBtn) {
    const handleCloseClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closeModal();
      return false;
    };
    
    closeBtn.addEventListener('click', handleCloseClick, { capture: true, passive: false });
    closeBtn.addEventListener('touchend', handleCloseClick, { capture: true, passive: false });
    
    if ('ontouchstart' in window === false) {
      closeBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      }, { capture: true });
    }
  }
  
  modal.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === modal && isModalOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    }
  }, { passive: false });
  
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    const sliderContainer = target.closest('.slider-image-container');
    if (sliderContainer) {
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
  
  document.addEventListener('keydown', (e) => {
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
      url: 'https://t.me/tribute/app?startapp=sFjs'
    },
    eur: {
      amount: '250 €',
      url: 'https://t.me/tribute/app?startapp=sFjp'
    }
  },
  '2': {
    name: 'Все и сразу',
    rub: {
      amount: '56.500 ₽',
      url: 'https://t.me/tribute/app?startapp=sFjo'
    },
    eur: {
      amount: '600 €',
      url: 'https://t.me/tribute/app?startapp=sFjk'
    }
  }
};

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
    
    // Update amounts
    if (rubAmount) rubAmount.textContent = tariff.rub.amount;
    if (eurAmount) eurAmount.textContent = tariff.eur.amount;
    
    // Update links
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
    
    // Show modal with animation
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Trigger animation
    scheduleRAF(() => {
      modal.classList.add('is-open');
      backdrop?.classList.add('is-active');
    });
    
    isModalOpen = true;
    
    // Haptic feedback
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) {
      e.preventDefault();
      closeModal();
    }
  }, { passive: false });
  
  // Handle tariff button clicks
  const tariffButtons = document.querySelectorAll('[data-tariff]');
  tariffButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tariffId = (btn as HTMLElement).dataset.tariff;
      if (tariffId) {
        openModal(tariffId);
      }
    }, { passive: false });
  });
  
  // Currency button click handlers (for analytics)
  if (rubBtn) {
    rubBtn.addEventListener('click', () => {
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    });
  }
  
  if (eurBtn) {
    eurBtn.addEventListener('click', () => {
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    });
  }
  
  // Expose functions globally for Telegram WebApp BackButton
  (window as any).closeCurrencyModal = closeModal;
  (window as any).isCurrencyModalOpen = () => isModalOpen;
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

