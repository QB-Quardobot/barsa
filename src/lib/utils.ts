/**
 * Shared Utility Functions
 * DRY Principle: Reusable functions to eliminate code duplication
 */

/**
 * Check if code is running in development environment
 * DRY: Used across multiple files (logger, analytics, etc.)
 */
export function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('.ngrok.io') ||
    hostname.includes('.trycloudflare.com')
  );
}

/**
 * Check if code is running in production environment
 */
export function isProduction(): boolean {
  return !isDevelopment();
}

/**
 * RequestIdleCallback wrapper with fallback to setTimeout
 * DRY: Used for lazy loading non-critical code
 * 
 * @param callback Function to execute when idle
 * @param timeout Maximum time to wait before executing (ms)
 */
export function whenIdle(
  callback: () => void,
  timeout: number = 2000
): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, Math.min(timeout, 100));
  }
}

/**
 * DOM ready wrapper with requestIdleCallback for non-critical code
 * DRY: Used for initializing features after page is interactive
 * 
 * @param callback Function to execute when DOM is ready
 * @param idleTimeout Timeout for requestIdleCallback (ms)
 */
export function whenReady(
  callback: () => void,
  idleTimeout: number = 2000
): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      whenIdle(callback, idleTimeout);
    }, { once: true });
  } else {
    whenIdle(callback, idleTimeout);
  }
}

/**
 * Create IntersectionObserver for lazy loading images
 * DRY: Used in multiple places for lazy image loading
 * ERROR HANDLING: Wrapped in try-catch for graceful degradation
 * 
 * @param onIntersect Callback when element intersects viewport
 * @param rootMargin Root margin for observer (default: '50px')
 * @returns IntersectionObserver instance or null if not supported
 */
export function createLazyImageObserver(
  onIntersect: (img: HTMLImageElement) => void,
  rootMargin: string = '50px'
): IntersectionObserver | null {
  try {
    if (typeof IntersectionObserver === 'undefined') {
      return null;
    }

    return new IntersectionObserver((entries, observer) => {
      try {
        entries.forEach(entry => {
          try {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              
              // If image is already loaded, show it immediately
              if (img.complete && img.naturalHeight !== 0) {
                onIntersect(img);
                observer.unobserve(img);
              } else {
                // Wait for image to load
                const handleLoad = () => {
                  try {
                    onIntersect(img);
                    observer.unobserve(img);
                  } catch (e) {
                    // Graceful degradation: continue
                  }
                };
                
                const handleError = () => {
                  try {
                    // Handle error - still show image to prevent white space
                    onIntersect(img);
                    observer.unobserve(img);
                  } catch (e) {
                    // Graceful degradation: continue
                  }
                };
                
                try {
                  img.addEventListener('load', handleLoad, { once: true });
                  img.addEventListener('error', handleError, { once: true });
                } catch (e) {
                  // Graceful degradation: show image immediately if event listener fails
                  onIntersect(img);
                }
              }
            }
          } catch (e) {
            // Graceful degradation: continue with next entry
          }
        });
      } catch (e) {
        // Graceful degradation: silently fail
      }
    }, {
      rootMargin,
      threshold: 0.01
    });
  } catch (error) {
    // Graceful degradation: return null if observer creation fails
    return null;
  }
}

/**
 * Initialize lazy loading for images
 * DRY: Reusable function for lazy image loading
 * 
 * @param selector CSS selector for lazy images (default: 'img[loading="lazy"]')
 * @param rootMargin Root margin for observer (default: '50px')
 */
export function initLazyImages(
  selector: string = 'img[loading="lazy"]',
  rootMargin: string = '50px'
): void {
  const lazyImages = document.querySelectorAll<HTMLImageElement>(selector);
  
  if (!lazyImages.length) return;

  // IMAGE FIX: Immediately mark ilya-photo and real-photo as loaded to ensure visibility on mobile
  lazyImages.forEach(img => {
    if (img.classList.contains('ilya-photo') || img.classList.contains('real-photo')) {
      img.classList.add('loaded');
      // Also ensure image is visible
      img.style.opacity = '1';
      img.style.visibility = 'visible';
    }
  });

  const observer = createLazyImageObserver((img) => {
    img.classList.add('loaded');
  }, rootMargin);

  if (!observer) {
    // Fallback: show all images immediately
    lazyImages.forEach(img => {
      img.classList.add('loaded');
    });
    return;
  }

  // Check initial viewport and observe remaining images
  lazyImages.forEach(img => {
    // Skip ilya-photo and real-photo - they're already handled above
    if (img.classList.contains('ilya-photo') || img.classList.contains('real-photo')) {
      return;
    }
    
    const rect = img.getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 50 &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
    
    if (isInViewport && img.complete && img.naturalHeight !== 0) {
      // Already loaded and in viewport - show immediately
      img.classList.add('loaded');
    } else {
      // Observe for lazy loading
      observer.observe(img);
    }
  });
}

/**
 * Check if element is in viewport
 * DRY: Reusable viewport check
 */
export function isInViewport(element: Element, margin: number = 0): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -margin &&
    rect.left >= -margin &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + margin &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + margin
  );
}

