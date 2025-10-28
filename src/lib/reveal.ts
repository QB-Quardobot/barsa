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
  private options: RevealOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1,
    once: true,
  };

  constructor(options?: RevealOptions) {
    this.options = { ...this.options, ...options };
    this.init();
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
    window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', (e) => {
        if (e.matches) {
          this.showAllImmediately();
        }
      });
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        element.classList.add('is-revealed');
        
        // Unobserve if once is true
        if (this.options.once) {
          this.observer?.unobserve(element);
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
      }
    });
  } else {
    if (!revealInstance) {
      revealInstance = new RevealAnimations();
    }
  }
}

export { RevealAnimations, initReveal };
export default RevealAnimations;

