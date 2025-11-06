/**
 * Reveal animations using Intersection Observer
 * Applies reveal-fade, reveal-up, reveal-scale, and extended animations
 * Extended by Agent #3 for enhanced UX
 */

interface RevealOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

class RevealAnimations {
  private observer: IntersectionObserver | null = null;
  private prerenderObserver: IntersectionObserver | null = null; // For fast scroll prerendering
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
                // Force layout calculation to prevent white flash
                // This ensures browser has calculated the element's layout
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

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      this.options
    );

    // Observe all elements with reveal classes (including new extended animations)
    const elements = document.querySelectorAll(
      '[class*="reveal-fade"], [class*="reveal-up"], [class*="reveal-scale"], ' +
      '[class*="reveal-slide-left"], [class*="reveal-slide-right"], [class*="reveal-blur"], ' +
      '[class*="reveal-rotate"], [class*="reveal-bounce"], [class*="reveal-glow"], ' +
      '[class*="reveal-stagger"]'
    );

    elements.forEach((el) => this.observer!.observe(el));
    
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
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          
          // If already revealed, skip
          if (element.classList.contains('is-revealed')) {
            return;
          }
          
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
          // This prevents white flashes while maintaining performance
          if (this.isFastScrolling) {
            // Immediate reveal for fast scroll (no animation)
            element.style.transition = 'none';
            element.style.opacity = '1';
            element.style.transform = 'translateZ(0)';
            element.classList.add('is-revealed');
            
            // Clean up after a moment
            setTimeout(() => {
              element.style.transition = '';
              element.style.willChange = 'auto';
            }, 100);
          } else {
            // Normal reveal animation - plays when element is close to viewport
            // Optimize will-change based on element type for better performance
            const isPricingCard = element.classList.contains('pricing-card');
            const isGlow = element.classList.contains('reveal-glow');
            
            // Pricing cards don't need will-change - they're optimized separately
            if (!isPricingCard) {
              if (isGlow) {
                element.style.willChange = 'opacity, filter, box-shadow';
              } else {
                // Use transform for beautiful GPU-accelerated animations
                element.style.willChange = 'opacity, transform';
              }
            }
            
            element.classList.add('is-animating');
            
            // Force a reflow to ensure styles are applied
            element.offsetHeight;
            
            // Trigger animation by adding is-revealed class
            element.classList.add('is-revealed');
            
            // Clean up will-change after animation completes (700ms matches CSS duration)
            setTimeout(() => {
              if (!isPricingCard) {
                element.style.willChange = 'auto';
              }
              element.classList.remove('is-animating');
              element.classList.add('animation-complete');
            }, 700); // Match CSS transition duration
          }
          
          // Unobserve if once is true
          if (this.options.once) {
            this.observer?.unobserve(element);
            // Also unobserve from prerender observer if it exists
            if (this.prerenderObserver) {
              this.prerenderObserver.unobserve(element);
            }
          }
        }
      });
    });
  }
  
  private animateStagger(element: HTMLElement) {
    const children = Array.from(element.children) as HTMLElement[];
    
    // Use requestAnimationFrame to ensure smooth rendering
    requestAnimationFrame(() => {
      children.forEach((child, index) => {
        // Set CSS custom property for stagger delay
        child.style.setProperty('--stagger-delay', index.toString());
        
        // CRITICAL: Don't set transform on children to avoid stacking context issues
        // GPU acceleration is handled by CSS with clip-path animations
      });
      
      element.classList.add('is-revealed');
      
      // Observe children if needed
      if (this.observer) {
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
    requestAnimationFrame(() => {
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
          
          // Use will-change only when animating
          if (!element.style.willChange) {
            element.style.willChange = 'transform';
          }
          
          element.style.transform = `translate3d(0, ${yPos}px, 0)`;
        } else {
          // Remove will-change when element is off-screen
          element.style.willChange = 'auto';
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
    
    // Find all reveal elements between current and target
    const allRevealElements = document.querySelectorAll(
      '[class*="reveal-fade"]:not(.is-revealed), [class*="reveal-up"]:not(.is-revealed), [class*="reveal-scale"]:not(.is-revealed), ' +
      '[class*="reveal-slide-left"]:not(.is-revealed), [class*="reveal-slide-right"]:not(.is-revealed), [class*="reveal-blur"]:not(.is-revealed), ' +
      '[class*="reveal-rotate"]:not(.is-revealed), [class*="reveal-bounce"]:not(.is-revealed), [class*="reveal-glow"]:not(.is-revealed), ' +
      '[class*="reveal-stagger"]:not(.is-revealed)'
    );
    
    allRevealElements.forEach((el) => {
      const elRect = (el as HTMLElement).getBoundingClientRect();
      const elScroll = elRect.top + currentScroll;
      
      // If element is between current scroll and target, reveal it immediately
      if (elScroll >= currentScroll - 200 && elScroll <= targetScroll + 500) {
        const element = el as HTMLElement;
        element.style.transition = 'none';
        element.style.opacity = '1';
        element.style.transform = 'translateZ(0)';
        element.classList.add('is-revealed');
        
        // Unobserve if observer exists
        if (this.observer) {
          this.observer.unobserve(element);
        }
      }
    });
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

    if (this.observer) {
      elements.forEach((el) => this.observer!.unobserve(el));
    }
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.disablePrerenderMode();
    if (this.fastScrollTimeout) {
      clearTimeout(this.fastScrollTimeout);
      this.fastScrollTimeout = null;
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

