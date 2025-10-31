/**
 * Reveal animations using Intersection Observer
 * Applies reveal-fade, reveal-up, and reveal-scale animations
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

  constructor(options?: RevealOptions) {
    this.options = { ...this.options, ...options };
    this.trackScrollVelocity();
    this.init();
  }
  
  private rafId: number | null = null;
  
  private trackScrollVelocity() {
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    
    const updateVelocity = () => {
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
      
      this.rafId = requestAnimationFrame(updateVelocity);
    };
    
    this.rafId = requestAnimationFrame(updateVelocity);
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
        '[class*="reveal-fade"]:not(.is-revealed), [class*="reveal-up"]:not(.is-revealed), [class*="reveal-scale"]:not(.is-revealed)'
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

    // Observe all elements with reveal classes
    const elements = document.querySelectorAll(
      '[class*="reveal-fade"], [class*="reveal-up"], [class*="reveal-scale"]'
    );

    elements.forEach((el) => this.observer!.observe(el));

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
          
          // During fast scrolling, show immediately without animation
          // This prevents white flashes while maintaining performance
          if (this.isFastScrolling) {
            // Immediate reveal for fast scroll (no animation)
            element.style.transition = 'none';
            element.style.opacity = '1';
            element.style.transform = 'none';
            element.classList.add('is-revealed');
            
            // Clean up after a moment
            setTimeout(() => {
              element.style.transition = '';
              element.style.willChange = 'auto';
            }, 100);
          } else {
            // Normal reveal animation - plays when element is close to viewport
            element.style.willChange = 'opacity, transform';
            
            // Force a reflow to ensure styles are applied
            element.offsetHeight;
            
            // Trigger animation by adding is-revealed class
            element.classList.add('is-revealed');
            
            // Clean up will-change after animation completes
            setTimeout(() => {
              element.style.willChange = 'auto';
            }, 600); // Match CSS transition duration
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
      '[class*="reveal-fade"]:not(.is-revealed), [class*="reveal-up"]:not(.is-revealed), [class*="reveal-scale"]:not(.is-revealed)'
    );
    
    allRevealElements.forEach((el) => {
      const elRect = (el as HTMLElement).getBoundingClientRect();
      const elScroll = elRect.top + currentScroll;
      
      // If element is between current scroll and target, reveal it immediately
      if (elScroll >= currentScroll - 200 && elScroll <= targetScroll + 500) {
        const element = el as HTMLElement;
        element.style.transition = 'none';
        element.style.opacity = '1';
        element.style.transform = 'none';
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
      '[class*="reveal-fade"], [class*="reveal-up"], [class*="reveal-scale"]'
    );

    elements.forEach((el) => {
      (el as HTMLElement).classList.add('is-revealed');
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

