/**
 * Cleanup Manager
 * Centralized resource cleanup to prevent memory leaks
 */

interface CleanupFunction {
  (): void;
}

class CleanupManager {
  private cleanupFunctions: Set<CleanupFunction> = new Set();
  private isDestroyed = false;

  /**
   * Register a cleanup function
   */
  register(cleanup: CleanupFunction): () => void {
    if (this.isDestroyed) {
      // If already destroyed, run cleanup immediately
      cleanup();
      return () => {};
    }

    this.cleanupFunctions.add(cleanup);

    // Return unregister function
    return () => {
      this.cleanupFunctions.delete(cleanup);
    };
  }

  /**
   * Execute all cleanup functions and clear the registry
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.cleanupFunctions.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        // Silently fail during cleanup to ensure all resources are freed
        if (typeof window !== 'undefined' && (window as any).__DEV__) {
          console.warn('[CleanupManager] Error during cleanup:', error);
        }
      }
    });

    this.cleanupFunctions.clear();
    this.isDestroyed = true;
  }

  /**
   * Get count of registered cleanup functions
   */
  getCount(): number {
    return this.cleanupFunctions.size;
  }
}

// Global cleanup manager instance
let globalCleanupManager: CleanupManager | null = null;

/**
 * Get or create global cleanup manager
 */
export function getCleanupManager(): CleanupManager {
  if (!globalCleanupManager) {
    globalCleanupManager = new CleanupManager();

    // Auto-cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        globalCleanupManager?.destroy();
      });

      // Also cleanup on visibility change (SPA navigation)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Don't destroy, just note - cleanup will happen on unload
        }
      });
    }
  }

  return globalCleanupManager;
}

/**
 * Register a cleanup function
 */
export function registerCleanup(cleanup: CleanupFunction): () => void {
  return getCleanupManager().register(cleanup);
}

/**
 * Destroy all registered cleanup functions
 */
export function destroyAllCleanup(): void {
  if (globalCleanupManager) {
    globalCleanupManager.destroy();
    globalCleanupManager = null;
  }
}

/**
 * Helper to create event listener with auto-cleanup
 */
export function createEventListener<T extends Event>(
  target: EventTarget,
  event: string,
  handler: (e: T) => void,
  options?: AddEventListenerOptions
): () => void {
  target.addEventListener(event, handler as EventListener, options);

  // Return cleanup function
  return registerCleanup(() => {
    target.removeEventListener(event, handler as EventListener, options);
  });
}

/**
 * Helper to create observer with auto-cleanup
 */
export function createObserver<T extends IntersectionObserver | MutationObserver | ResizeObserver>(
  observer: T
): () => void {
  return registerCleanup(() => {
    if ('disconnect' in observer) {
      observer.disconnect();
    }
  });
}

export { CleanupManager };

