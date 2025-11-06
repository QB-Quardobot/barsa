/**
 * Reveal animations using Intersection Observer
 * Applies reveal-fade, reveal-up, reveal-scale, and extended animations
 * Extended by Agent #3 for enhanced UX
 * OPTIMIZED: Uses global IntersectionObserver for better performance
 * OPTIMIZED: All scroll/touch event listeners use { passive: true } for better performance
 * OPTIMIZED: will-change management - added ONLY before animation, removed immediately after
 *   - Prevents unnecessary GPU memory allocation
 *   - Uses transitionend event for precise timing
 *   - Fallback to setTimeout for safety
 */

interface RevealOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

// OPTIMIZED: Request Animation Frame Pooling
// Instead of multiple RAF calls, batch all callbacks into a single RAF per frame
// This reduces CPU load and improves performance by synchronizing all animations
const rafQueue: (() => void)[] = [];
let rafScheduled = false;
let rafId: number | null = null;

/**
 * Schedule a callback to run in the next animation frame
 * All callbacks are batched into a single RAF call for better performance
 */
export function scheduleRAF(callback: () => void): void {
  rafQueue.push(callback);
  if (!rafScheduled) {
    rafScheduled = true;
    rafId = requestAnimationFrame(() => {
      rafScheduled = false;
      // Copy queue and clear it before executing to allow new callbacks to be added during execution
      const queue = [...rafQueue];
      rafQueue.length = 0;
      // Execute all callbacks in the queue
      queue.forEach(cb => {
        try {
          cb();
        } catch (error) {
          // Silently handle errors to prevent one callback from breaking others
          console.error('Error in RAF callback:', error);
        }
      });
      rafId = null;
    });
  }
}

/**
 * Cancel scheduled RAF if needed (for cleanup)
 */
export function cancelScheduledRAF(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
    rafScheduled = false;
    rafQueue.length = 0;
  }
}

// OPTIMIZED: Global IntersectionObserver for entire page (virtualization)
// This reduces memory usage and improves performance by batching all intersection calculations
let globalIntersectionObserver: IntersectionObserver | null = null;
const globalObserverHandlers = new Map<HTMLElement, (entry: IntersectionObserverEntry) => void>();

function getGlobalObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }
  
  if (!globalIntersectionObserver) {
    // OPTIMIZED: Single observer with detailed threshold tracking
    globalIntersectionObserver = new IntersectionObserver(
      (entries) => {
        // OPTIMIZED: Use RAF pooling for batch processing
        scheduleRAF(() => {
          entries.forEach((entry) => {
            const element = entry.target as HTMLElement;
            const handler = globalObserverHandlers.get(element);
            if (handler) {
              handler(entry);
            }
          });
        });
      },
      {
        root: null,
        rootMargin: '200px 0px', // Pre-load 200px before and after viewport
        threshold: [0, 0.25, 0.5, 0.75, 1], // Detailed tracking for progressive reveals
      }
    );
  }
  
  return globalIntersectionObserver;
}

function registerGlobalObserver(element: HTMLElement, handler: (entry: IntersectionObserverEntry) => void): void {
  const observer = getGlobalObserver();
  if (!observer) return;
  
  globalObserverHandlers.set(element, handler);
  observer.observe(element);
}

function unregisterGlobalObserver(element: HTMLElement): void {
  const observer = getGlobalObserver();
  if (!observer) return;
  
  globalObserverHandlers.delete(element);
  observer.unobserve(element);
}

class RevealAnimations {
  private observer: IntersectionObserver | null = null; // Kept for backward compatibility
  private prerenderObserver: IntersectionObserver | null = null; // For fast scroll prerendering
  private useGlobalObserver: boolean = true; // Use global observer by default
  private options: RevealOptions = {
    root: null,
    // Normal rootMargin for reveal animations (element triggers when ~100px from viewport)
    // This allows animations to be visible while ensuring content is ready
    rootMargin: '0px 0px 100px 0px',
    threshold: 0.1, // Standard threshold for when element enters viewport
    once: true,
  };
  private scrollVelocity = 0;
  private fastScrollThreshold = 50; // pixels per frame for fast scroll
  private isFastScrolling = false;
  private fastScrollTimeout: number | null = null;
  private scrollThrottleTimeout: number | null = null;

  private parallaxElements: Map<HTMLElement, number> = new Map();
  private parallaxTicking = false;
  private parallaxHandler: (() => void) | null = null;

  constructor(options?: RevealOptions) {
    this.options = { ...this.options, ...options };
    this.trackScrollVelocity();
    this.init();
    this.setupParallax();
  }
  
  private rafId: number | null = null;
  
  private trackScrollVelocity() {
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    
    // Use scroll event with throttling instead of continuous RAF
    const handleScroll = () => {
      // Cancel pending update
      if (this.scrollThrottleTimeout) {
        cancelAnimationFrame(this.scrollThrottleTimeout);
      }
      
      // Throttle to every frame (16ms at 60fps)
      // Note: Using direct RAF here for cancelable throttling (critical for scroll performance)
      this.scrollThrottleTimeout = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const currentTime = performance.now();
        const deltaY = Math.abs(currentScrollY - lastScrollY);
        const deltaTime = currentTime - lastTime;
        
        if (deltaTime > 0) {
          this.scrollVelocity = deltaY / deltaTime * 16.67; // pixels per frame (assuming 60fps)
        }
        
        // Detect fast scrolling and adjust strategy
        const wasFastScrolling = this.isFastScrolling;
        this.isFastScrolling = this.scrollVelocity > this.fastScrollThreshold;
        
        // If just started fast scrolling, switch to prerender mode
        if (!wasFastScrolling && this.isFastScrolling) {
          this.enablePrerenderMode();
        }
        
        // If stopped fast scrolling, switch back to normal mode after delay
        if (wasFastScrolling && !this.isFastScrolling) {
          if (this.fastScrollTimeout) {
            clearTimeout(this.fastScrollTimeout);
          }
          this.fastScrollTimeout = window.setTimeout(() => {
            this.disablePrerenderMode();
          }, 300); // Wait 300ms after scroll stops to ensure it's actually stopped
        }
        
        lastScrollY = currentScrollY;
        lastTime = currentTime;
        this.scrollThrottleTimeout = null;
      });
    };
    
    // Use passive scroll listener instead of continuous RAF
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Store handler for cleanup
    (this as any).scrollHandler = handleScroll;
  }
  
  private enablePrerenderMode() {
    // Create separate observer with larger rootMargin for prerendering
    // This loads content ahead during fast scroll to prevent white flashes
    // but doesn't trigger animations - normal observer handles that
    if (!this.prerenderObserver) {
      this.prerenderObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              
              // Only prerender if not already revealed
              // We prepare the element but don't reveal it yet
              if (!element.classList.contains('is-revealed')) {
                // OPTIMIZED: Add will-change only before animation starts
                // This will be removed after reveal animation completes
                element.style.willChange = 'opacity, transform';
                element.offsetHeight; // Force reflow - ensures layout is calculated
                // Make sure element is in render tree but still hidden
                // Visibility visible but opacity 0 (from CSS) maintains layout
              }
            }
          });
        },
        {
          root: null,
          rootMargin: '0px 0px 800px 0px', // Large margin for prerendering ahead
          threshold: 0.01, // Very low threshold - just needs to intersect
        }
      );
      
      // Observe all reveal elements that haven't been revealed yet
      const elements = document.querySelectorAll(
        '[class*="reveal-fade"]:not(.is-revealed), [class*="reveal-up"]:not(.is-revealed), [class*="reveal-scale"]:not(.is-revealed), ' +
        '[class*="reveal-slide-left"]:not(.is-revealed), [class*="reveal-slide-right"]:not(.is-revealed), [class*="reveal-blur"]:not(.is-revealed), ' +
        '[class*="reveal-rotate"]:not(.is-revealed), [class*="reveal-bounce"]:not(.is-revealed), [class*="reveal-glow"]:not(.is-revealed), ' +
        '[class*="reveal-stagger"]:not(.is-revealed)'
      );
      elements.forEach((el) => {
        this.prerenderObserver!.observe(el);
      });
    }
  }
  
  private disablePrerenderMode() {
    if (this.prerenderObserver) {
      this.prerenderObserver.disconnect();
      this.prerenderObserver = null;
    }
  }

  private init() {
    // Check if Intersection Observer is supported
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: show all elements immediately
      this.showAllImmediately();
      return;
    }

    // OPTIMIZED: Use global observer for better performance
    if (this.useGlobalObserver) {
      const globalObserver = getGlobalObserver();
      if (globalObserver) {
        // Use global observer instead of creating a new one
        this.observer = globalObserver;
      } else {
        // Fallback to local observer if global is not available
        this.observer = new IntersectionObserver(
          (entries) => this.handleIntersection(entries),
          this.options
        );
      }
    } else {
      // Legacy: create local observer (for backward compatibility)
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        this.options
      );
    }

    // Observe all elements with reveal classes (including new extended animations)
    const elements = document.querySelectorAll(
      '[class*="reveal-fade"], [class*="reveal-up"], [class*="reveal-scale"], ' +
      '[class*="reveal-slide-left"], [class*="reveal-slide-right"], [class*="reveal-blur"], ' +
      '[class*="reveal-rotate"], [class*="reveal-bounce"], [class*="reveal-glow"], ' +
      '[class*="reveal-stagger"]'
    );

    // OPTIMIZED: Register elements with global observer
    elements.forEach((el) => {
      const element = el as HTMLElement;
      if (this.useGlobalObserver && globalIntersectionObserver) {
        // Register with global observer
        registerGlobalObserver(element, (entry) => {
          // Create a batch of entries for handleIntersection
          this.handleIntersection([entry]);
        });
      } else if (this.observer) {
        // Use local observer
        this.observer.observe(element);
      }
    });
    
    // Special optimization for pricing section - preload all cards when section is approaching
    this.initPricingSectionOptimization();
    
    // Initialize stagger animations
    this.initStaggerAnimations();
    
    // Initialize counter animations
    this.initCounterAnimations();

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.showAllImmediately();
    }

    // Listen for reduced motion changes
    const reducedMotionHandler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        this.showAllImmediately();
      }
    };
    
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionMedia.addEventListener('change', reducedMotionHandler);
    
    // Store handler for cleanup
    (this as any).reducedMotionHandler = reducedMotionHandler;
    (this as any).reducedMotionMedia = reducedMotionMedia;
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    // Batch operations for better performance, especially for pricing cards
    const pricingCards: HTMLElement[] = [];
    const otherElements: HTMLElement[] = [];
    
    // Separate pricing cards from other elements for batch processing
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        
        // CRITICAL: Skip if already revealed OR already processed by pricing observer
        if (element.classList.contains('is-revealed') || 
            element.getAttribute('data-reveal-processed') === 'true') {
          // Also unobserve to prevent future processing
          if (this.useGlobalObserver) {
            unregisterGlobalObserver(element);
          } else if (this.observer) {
            this.observer.unobserve(element);
          }
          return;
        }
        
        if (element.classList.contains('pricing-card')) {
          pricingCards.push(element);
        } else {
          otherElements.push(element);
        }
      }
    });
    
    // OPTIMIZED: Batch reveal all pricing cards at once to prevent re-rendering
    // Using CSS classes instead of inline styles for better performance
    if (pricingCards.length > 0) {
      // CRITICAL: Unobserve ALL pricing cards SYNCHRONOUSLY before any DOM changes
      // This prevents them from being processed again by observers
      pricingCards.forEach((element) => {
        if (this.useGlobalObserver) {
          unregisterGlobalObserver(element);
        } else if (this.observer) {
          this.observer.unobserve(element);
        }
        if (this.prerenderObserver) {
          this.prerenderObserver.unobserve(element);
        }
      });
      
      // OPTIMIZED: Batch reveal with delay to give browser time to paint each card
      // This prevents re-rendering and ensures smooth reveal
      pricingCards.forEach((element, index) => {
        // Skip if already processed (safety check)
        if (element.classList.contains('is-revealed') || 
            element.getAttribute('data-reveal-processed') === 'true') {
          return;
        }
        
        // OPTIMIZED: Reveal with 50ms delay between cards
        // This gives browser time to paint each card individually
        setTimeout(() => {
          scheduleRAF(() => {
            // OPTIMIZED: Use CSS class instead of inline styles
            // This is much faster and allows browser to optimize rendering
            element.classList.add('is-revealed-immediate');
            element.classList.add('is-revealed');
            element.setAttribute('data-reveal-processed', 'true');
          });
        }, index * 50); // 50ms delay between cards
      });
    }
    
    // Handle other elements normally
    if (otherElements.length > 0) {
      scheduleRAF(() => {
        otherElements.forEach((element) => {
          // Handle stagger animation
          if (element.classList.contains('reveal-stagger')) {
            this.animateStagger(element);
            return;
          }
          
          // Handle counter animation
          if (element.classList.contains('stat-number') && element.dataset.counterTarget) {
            element.classList.add('is-counting');
            this.animateCounter(element);
          }
          
          // During fast scrolling, show immediately without animation
          if (this.isFastScrolling) {
            element.style.transition = 'none';
            element.style.opacity = '1';
            element.style.transform = 'translateZ(0)';
            element.classList.add('is-revealed');
            
            setTimeout(() => {
              element.style.transition = '';
              element.style.willChange = 'auto';
            }, 100);
          } else {
            // Normal reveal animation
            const isGlow = element.classList.contains('reveal-glow');
            
            // OPTIMIZED: Add will-change ONLY before animation starts
            if (isGlow) {
              element.style.willChange = 'opacity, filter, box-shadow';
            } else {
              element.style.willChange = 'opacity, transform';
            }
            
            element.classList.add('is-animating');
            element.offsetHeight; // Force reflow
            element.classList.add('is-revealed');
            
            // OPTIMIZED: Remove will-change immediately after animation completes
            // Use transitionend event for precise timing, fallback to setTimeout
            const removeWillChange = () => {
              element.style.willChange = 'auto'; // Free GPU memory
              element.classList.remove('is-animating');
              element.classList.add('animation-complete');
              element.removeEventListener('transitionend', removeWillChange);
            };
            
            // Listen for transition end (more precise than setTimeout)
            element.addEventListener('transitionend', removeWillChange, { once: true });
            
            // Fallback timeout in case transitionend doesn't fire
            setTimeout(() => {
              if (element.style.willChange !== 'auto') {
                removeWillChange();
              }
            }, 700);
          }
          
          // Unobserve if once is true
          if (this.options.once) {
            if (this.useGlobalObserver) {
              unregisterGlobalObserver(element);
            } else if (this.observer) {
              this.observer.unobserve(element);
            }
            if (this.prerenderObserver) {
              this.prerenderObserver.unobserve(element);
            }
          }
        });
      });
    }
  }
  
  /**
   * Special optimization for pricing section
   * Preloads all pricing cards when section is approaching viewport
   * CRITICAL: This must unobserve elements from main observer BEFORE revealing
   * to prevent double-processing and re-rendering
   */
  private initPricingSectionOptimization(): void {
    const pricingSection = document.getElementById('pricing');
    if (!pricingSection) return;
    
    // Store pricing observer for cleanup
    let pricingObserver: IntersectionObserver | null = null;
    
    // Create observer with larger rootMargin to trigger earlier
    pricingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // When pricing section is approaching, reveal all cards immediately
            const pricingCards = pricingSection.querySelectorAll('.pricing-card:not(.is-revealed)');
            if (pricingCards.length > 0) {
              // CRITICAL: Unobserve from main observer FIRST to prevent double-processing
              pricingCards.forEach((el) => {
                const element = el as HTMLElement;
                // Unobserve from main observer BEFORE any processing
                if (this.useGlobalObserver) {
                  unregisterGlobalObserver(element);
                } else if (this.observer) {
                  this.observer.unobserve(element);
                }
              });
              
              // OPTIMIZED: Batch reveal with delay to give browser time to paint each card
              // This prevents re-rendering and ensures smooth reveal
              const cardsArray = Array.from(pricingCards) as HTMLElement[];
              cardsArray.forEach((element, index) => {
                // Skip if already revealed (safety check)
                if (element.classList.contains('is-revealed')) {
                  return;
                }
                
                // OPTIMIZED: Reveal with 50ms delay between cards
                // This gives browser time to paint each card individually
                setTimeout(() => {
                  scheduleRAF(() => {
                    // OPTIMIZED: Use CSS class instead of inline styles
                    // This is much faster and allows browser to optimize rendering
                    element.classList.add('is-revealed-immediate');
                    element.classList.add('is-revealed');
                    
                    // Mark as processed to prevent any future re-processing
                    element.setAttribute('data-reveal-processed', 'true');
                  });
                }, index * 50); // 50ms delay between cards
              });
            }
            
            // Unobserve pricing section after first trigger
            if (pricingObserver) {
              pricingObserver.unobserve(pricingSection);
              pricingObserver.disconnect();
              pricingObserver = null;
            }
          }
        });
      },
      {
        rootMargin: '300px 0px', // Trigger 300px before section enters viewport
        threshold: 0
      }
    );
    
    pricingObserver.observe(pricingSection);
    
    // Store for cleanup
    (this as any).pricingObserver = pricingObserver;
  }
  
  private animateStagger(element: HTMLElement) {
    const children = Array.from(element.children) as HTMLElement[];
    
    // Use RAF pooling to ensure smooth rendering
    scheduleRAF(() => {
      children.forEach((child, index) => {
        // Set CSS custom property for stagger delay
        child.style.setProperty('--stagger-delay', index.toString());
        
        // CRITICAL: Don't set transform on children to avoid stacking context issues
        // GPU acceleration is handled by CSS with clip-path animations
      });
      
      element.classList.add('is-revealed');
      
      // Unobserve element after reveal
      if (this.useGlobalObserver) {
        unregisterGlobalObserver(element);
      } else if (this.observer) {
        this.observer.unobserve(element);
      }
    });
  }
  
  private initStaggerAnimations() {
    const staggerElements = document.querySelectorAll('.reveal-stagger');
    staggerElements.forEach((el) => {
      if (this.observer) {
        this.observer.observe(el);
      }
    });
  }
  
  /**
   * Animate counter using requestAnimationFrame for 60fps performance
   * Based on best practices: https://web.dev/animations-guide/
   * Uses ease-out cubic easing for natural deceleration
   */
  private animateCounter(element: HTMLElement) {
    const targetText = element.textContent || '0';
    const target = parseInt(element.dataset.counterTarget || targetText.replace(/[^0-9]/g, '') || '0');
    const duration = parseInt(element.dataset.counterDuration || '2000');
    const originalText = element.dataset.originalText || '';
    const suffix = originalText.match(/[^0-9]+$/)?.[0] || '';
    
    // Use easing function for smooth animation (ease-out cubic)
    // Better than linear animation for perceived smoothness
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };
    
    let startTime: number | null = null;
    const startValue = 0;
    
    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);
      element.textContent = currentValue + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = target + suffix;
        element.classList.remove('is-counting');
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  private initCounterAnimations() {
    const counterElements = document.querySelectorAll('.stat-number[data-counter-target]');
    counterElements.forEach((el) => {
      const element = el as HTMLElement;
      // Store original text
      element.dataset.originalText = element.textContent || '';
      element.textContent = '0' + (element.textContent?.match(/[^0-9]+$/)?.[0] || '');
      
      if (this.observer) {
        this.observer.observe(element);
      }
    });
  }
  
  private setupParallax() {
    // Find all parallax elements
    const parallaxElements = document.querySelectorAll('.parallax-layer');
    parallaxElements.forEach((el) => {
      const element = el as HTMLElement;
      const speed = parseFloat(element.dataset.parallaxSpeed || '0.3');
      this.parallaxElements.set(element, speed);
    });
    
    if (this.parallaxElements.size > 0) {
      this.parallaxHandler = this.handleParallax.bind(this);
      window.addEventListener('scroll', this.parallaxHandler, { passive: true });
    }
  }
  
  /**
   * Handle parallax scroll effect with performance optimizations
   * Best practices:
   * - Use requestAnimationFrame for smooth 60fps animation
   * - Throttle with ticking flag to prevent multiple RAF calls
   * - Calculate positions relative to viewport center for natural effect
   * - Use will-change only when element is visible
   * - Use translate3d for GPU acceleration
   */
  private handleParallax() {
    if (this.parallaxTicking) return;
    
    this.parallaxTicking = true;
    scheduleRAF(() => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      this.parallaxElements.forEach((speed, element) => {
        // Use getBoundingClientRect only once per frame for better performance
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const elementHeight = rect.height;
        
        // Only animate if element is visible in viewport (with 200px buffer)
        const isVisible = (
          elementTop + elementHeight > scrollY - 200 &&
          elementTop < scrollY + viewportHeight + 200
        );
        
        if (isVisible) {
          // Calculate parallax offset based on element's position relative to viewport center
          const elementCenter = elementTop + elementHeight / 2;
          const viewportCenter = scrollY + viewportHeight / 2;
          const distanceFromCenter = elementCenter - viewportCenter;
          const yPos = distanceFromCenter * speed;
          
          // OPTIMIZED: Add will-change ONLY when animating (before transform change)
          if (element.style.willChange !== 'transform') {
            element.style.willChange = 'transform';
          }
          
          element.style.transform = `translate3d(0, ${yPos}px, 0)`;
        } else {
          // OPTIMIZED: Remove will-change immediately when element is off-screen
          // This frees GPU memory when parallax is not needed
          if (element.style.willChange !== 'auto') {
            element.style.willChange = 'auto';
            element.style.willChange = ''; // Also clear inline style
          }
        }
      });
      
      this.parallaxTicking = false;
    });
  }
  
  /**
   * Pre-reveal elements between current scroll position and target
   * Used for smooth scroll to anchors to prevent white flash
   */
  public preRevealToTarget(targetSelector: string): void {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    
    const targetRect = target.getBoundingClientRect();
    const currentScroll = window.scrollY;
    const targetScroll = targetRect.top + currentScroll;
    
    // Special handling for pricing section - reveal all cards at once
    if (targetSelector === '#pricing' || target.classList.contains('pricing-section')) {
      const pricingCards = target.querySelectorAll('.pricing-card:not(.is-revealed)');
      if (pricingCards.length > 0) {
        // CRITICAL: Unobserve ALL pricing cards SYNCHRONOUSLY before any DOM changes
        pricingCards.forEach((el) => {
          const element = el as HTMLElement;
          if (this.useGlobalObserver) {
            unregisterGlobalObserver(element);
          } else if (this.observer) {
            this.observer.unobserve(element);
          }
          if (this.prerenderObserver) {
            this.prerenderObserver.unobserve(element);
          }
        });
        
        // OPTIMIZED: Batch reveal with delay to give browser time to paint each card
        const cardsArray = Array.from(pricingCards) as HTMLElement[];
        cardsArray.forEach((element, index) => {
          // OPTIMIZED: Reveal with 50ms delay between cards
          // This gives browser time to paint each card individually
          setTimeout(() => {
            scheduleRAF(() => {
              // OPTIMIZED: Use CSS class instead of inline styles
              element.classList.add('is-revealed-immediate');
              element.classList.add('is-revealed');
              element.setAttribute('data-reveal-processed', 'true');
            });
          }, index * 50); // 50ms delay between cards
        });
      }
    }
    
    // Find all other reveal elements between current and target
    const allRevealElements = document.querySelectorAll(
      '[class*="reveal-fade"]:not(.is-revealed), [class*="reveal-up"]:not(.is-revealed), [class*="reveal-scale"]:not(.is-revealed), ' +
      '[class*="reveal-slide-left"]:not(.is-revealed), [class*="reveal-slide-right"]:not(.is-revealed), [class*="reveal-blur"]:not(.is-revealed), ' +
      '[class*="reveal-rotate"]:not(.is-revealed), [class*="reveal-bounce"]:not(.is-revealed), [class*="reveal-glow"]:not(.is-revealed), ' +
      '[class*="reveal-stagger"]:not(.is-revealed)'
    );
    
    // Batch process other elements
    const elementsToReveal: HTMLElement[] = [];
    allRevealElements.forEach((el) => {
      const elRect = (el as HTMLElement).getBoundingClientRect();
      const elScroll = elRect.top + currentScroll;
      
      // Skip pricing cards (already handled above)
      if ((el as HTMLElement).classList.contains('pricing-card')) {
        return;
      }
      
      // If element is between current scroll and target, add to batch
      if (elScroll >= currentScroll - 200 && elScroll <= targetScroll + 500) {
        elementsToReveal.push(el as HTMLElement);
      }
    });
    
    // Batch reveal all elements at once
    if (elementsToReveal.length > 0) {
      scheduleRAF(() => {
        elementsToReveal.forEach((element) => {
          element.style.transition = 'none';
          element.style.opacity = '1';
          element.style.transform = 'translateZ(0)';
          element.classList.add('is-revealed');
          
          if (this.useGlobalObserver) {
            unregisterGlobalObserver(element);
          } else if (this.observer) {
            this.observer.unobserve(element);
          }
          if (this.prerenderObserver) {
            this.prerenderObserver.unobserve(element);
          }
        });
      });
    }
  }

  private showAllImmediately() {
    const elements = document.querySelectorAll(
      '[class*="reveal-fade"], [class*="reveal-up"], [class*="reveal-scale"], ' +
      '[class*="reveal-slide-left"], [class*="reveal-slide-right"], [class*="reveal-blur"], ' +
      '[class*="reveal-rotate"], [class*="reveal-bounce"], [class*="reveal-glow"], ' +
      '[class*="reveal-stagger"]'
    );

    elements.forEach((el) => {
      const element = el as HTMLElement;
      element.classList.add('is-revealed');
      
      // Handle stagger elements
      if (element.classList.contains('reveal-stagger')) {
        this.animateStagger(element);
      }
    });

    if (this.useGlobalObserver) {
      elements.forEach((el) => unregisterGlobalObserver(el as HTMLElement));
    } else if (this.observer) {
      elements.forEach((el) => this.observer!.unobserve(el));
    }
  }

  public destroy() {
    // OPTIMIZED: Cleanup global observer handlers for this instance
    if (this.useGlobalObserver) {
      // Remove all handlers registered by this instance
      // Note: We don't disconnect global observer as other instances might use it
      const elements = document.querySelectorAll(
        '[class*="reveal-fade"], [class*="reveal-up"], [class*="reveal-scale"], ' +
        '[class*="reveal-slide-left"], [class*="reveal-slide-right"], [class*="reveal-blur"], ' +
        '[class*="reveal-rotate"], [class*="reveal-bounce"], [class*="reveal-glow"], ' +
        '[class*="reveal-stagger"]'
      );
      elements.forEach((el) => {
        const element = el as HTMLElement;
        // Only unregister if handler exists (was registered by this instance)
        if (globalObserverHandlers.has(element)) {
          unregisterGlobalObserver(element);
        }
      });
    } else if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.disablePrerenderMode();
    if (this.fastScrollTimeout) {
      clearTimeout(this.fastScrollTimeout);
      this.fastScrollTimeout = null;
    }
    
    // Cleanup pricing observer if exists
    const pricingObserver = (this as any).pricingObserver;
    if (pricingObserver) {
      pricingObserver.disconnect();
      (this as any).pricingObserver = null;
    }
    
    // Cancel animation frame
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Cancel scroll throttle timeout
    if (this.scrollThrottleTimeout !== null) {
      cancelAnimationFrame(this.scrollThrottleTimeout);
      this.scrollThrottleTimeout = null;
    }
    
    // Remove scroll listener
    const scrollHandler = (this as any).scrollHandler;
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      (this as any).scrollHandler = null;
    }
    
    // Remove parallax listener
    if (this.parallaxHandler) {
      window.removeEventListener('scroll', this.parallaxHandler);
      this.parallaxHandler = null;
    }
    this.parallaxElements.clear();
    
    // Cleanup reduced motion listener
    const reducedMotionMedia = (this as any).reducedMotionMedia;
    const reducedMotionHandler = (this as any).reducedMotionHandler;
    if (reducedMotionMedia && reducedMotionHandler) {
      reducedMotionMedia.removeEventListener('change', reducedMotionHandler);
      (this as any).reducedMotionHandler = null;
      (this as any).reducedMotionMedia = null;
    }
  }
}

// Initialize on DOMContentLoaded
let revealInstance: RevealAnimations | null = null;

function initReveal() {
  if (typeof window === 'undefined') return;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!revealInstance) {
        revealInstance = new RevealAnimations();
        // Expose to window for external access (e.g., EarningsTicker)
        (window as any).revealInstance = revealInstance;
      }
    });
  } else {
    if (!revealInstance) {
      revealInstance = new RevealAnimations();
      // Expose to window for external access
      (window as any).revealInstance = revealInstance;
    }
  }
}

export { RevealAnimations, initReveal };
export default RevealAnimations;

