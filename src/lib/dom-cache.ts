/**
 * DOM Query Cache
 * Optimizes repeated DOM queries by caching results
 * Prevents redundant traversal and improves performance
 */

interface CacheEntry {
  element: Element | null;
  elements: NodeListOf<Element> | null;
  timestamp: number;
  ttl?: number; // Time to live in ms (optional)
}

class DOMCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 5000; // 5 seconds default cache TTL
  private maxCacheSize = 100;

  /**
   * Get single element (cached)
   */
  query(selector: string, root: Document | Element = document, ttl?: number): Element | null {
    const key = `query:${selector}:${root === document ? 'doc' : 'el'}`;
    const now = Date.now();
    
    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.element !== null) {
      const cacheTTL = cached.ttl || this.defaultTTL;
      
      // Check if still valid
      if (now - cached.timestamp < cacheTTL) {
        // Verify element still exists in DOM
        if (cached.element.isConnected) {
          return cached.element;
        }
      }
    }
    
    // Query DOM
    const element = root.querySelector(selector);
    
    // Cache result
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      element,
      elements: null,
      timestamp: now,
      ttl
    });
    
    return element;
  }

  /**
   * Get multiple elements (cached)
   */
  queryAll(selector: string, root: Document | Element = document, ttl?: number): NodeListOf<Element> | null {
    const key = `queryAll:${selector}:${root === document ? 'doc' : 'el'}`;
    const now = Date.now();
    
    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.elements !== null) {
      const cacheTTL = cached.ttl || this.defaultTTL;
      
      // Check if still valid
      if (now - cached.timestamp < cacheTTL) {
        // Verify elements still exist
        if (cached.elements.length === 0 || cached.elements[0].isConnected) {
          return cached.elements;
        }
      }
    }
    
    // Query DOM
    const elements = root.querySelectorAll(selector);
    
    // Cache result
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      element: null,
      elements,
      timestamp: now,
      ttl
    });
    
    return elements;
  }

  /**
   * Get element by ID (cached, no TTL as IDs are stable)
   */
  getById(id: string): HTMLElement | null {
    const key = `id:${id}`;
    const cached = this.cache.get(key);
    
    if (cached && cached.element !== null) {
      if (cached.element.isConnected) {
        return cached.element as HTMLElement;
      }
    }
    
    const element = document.getElementById(id);
    
    if (element) {
      this.cache.set(key, {
        element,
        elements: null,
        timestamp: Date.now(),
        ttl: Infinity // IDs don't change
      });
    }
    
    return element;
  }

  /**
   * Invalidate cache for a specific selector
   */
  invalidate(selector?: string): void {
    if (selector) {
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.includes(selector)) {
          this.cache.delete(key);
        }
      });
    } else {
      // Clear all
      this.cache.clear();
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    
    keys.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        const ttl = entry.ttl || this.defaultTTL;
        if (ttl !== Infinity && (now - entry.timestamp) > ttl) {
          this.cache.delete(key);
        }
      }
    });
  }

  /**
   * Get cache stats (for debugging)
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
let domCacheInstance: DOMCache | null = null;

/**
 * Get or create DOM cache instance
 */
export function getDOMCache(): DOMCache {
  if (!domCacheInstance) {
    domCacheInstance = new DOMCache();
    
    // Periodic cleanup every 10 seconds
    if (typeof window !== 'undefined') {
      setInterval(() => {
        domCacheInstance?.cleanup();
      }, 10000);
    }
  }
  
  return domCacheInstance;
}

/**
 * Cached querySelector
 */
export function $q(selector: string, root?: Document | Element): Element | null {
  return getDOMCache().query(selector, root);
}

/**
 * Cached querySelectorAll
 */
export function $qa(selector: string, root?: Document | Element): NodeListOf<Element> | null {
  return getDOMCache().queryAll(selector, root);
}

/**
 * Cached getElementById
 */
export function $id(id: string): HTMLElement | null {
  return getDOMCache().getById(id);
}

export { DOMCache };

