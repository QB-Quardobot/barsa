/**
 * Rate Limiter
 * Client-side rate limiting for analytics, API calls, and user interactions
 * Prevents spam and reduces server load
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  key?: string; // Optional key for different rate limits (e.g., 'analytics', 'api')
}

interface RequestRecord {
  timestamps: number[];
  count: number;
}

class RateLimiter {
  private records: Map<string, RequestRecord> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Configure rate limit for a specific key
   */
  configure(key: string, config: RateLimitConfig): void {
    this.configs.set(key, config);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string = 'default'): boolean {
    const config = this.configs.get(key) || {
      maxRequests: 10,
      windowMs: 60000 // 1 minute default
    };

    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { timestamps: [], count: 0 };
      this.records.set(key, record);
    }

    // Remove old timestamps outside the window
    record.timestamps = record.timestamps.filter(
      ts => now - ts < config.windowMs
    );
    record.count = record.timestamps.length;

    // Check if under limit
    if (record.count < config.maxRequests) {
      record.timestamps.push(now);
      record.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string = 'default'): number {
    const config = this.configs.get(key) || {
      maxRequests: 10,
      windowMs: 60000
    };

    const record = this.records.get(key);
    if (!record) return config.maxRequests;

    const now = Date.now();
    const validTimestamps = record.timestamps.filter(
      ts => now - ts < config.windowMs
    );

    return Math.max(0, config.maxRequests - validTimestamps.length);
  }

  /**
   * Get time until next allowed request (ms)
   */
  getRetryAfter(key: string = 'default'): number {
    const config = this.configs.get(key) || {
      maxRequests: 10,
      windowMs: 60000
    };

    const record = this.records.get(key);
    if (!record || record.timestamps.length === 0) return 0;

    const now = Date.now();
    const oldestTimestamp = Math.min(...record.timestamps);
    const elapsed = now - oldestTimestamp;

    return Math.max(0, config.windowMs - elapsed);
  }

  /**
   * Clear records for a key (or all if no key)
   */
  clear(key?: string): void {
    if (key) {
      this.records.delete(key);
    } else {
      this.records.clear();
    }
  }

  /**
   * Cleanup old records
   */
  cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.records.keys());

    keys.forEach(key => {
      const record = this.records.get(key);
      if (!record) return;

      const config = this.configs.get(key) || {
        maxRequests: 10,
        windowMs: 60000
      };

      // Remove old timestamps
      record.timestamps = record.timestamps.filter(
        ts => now - ts < config.windowMs
      );
      record.count = record.timestamps.length;

      // Remove empty records
      if (record.count === 0) {
        this.records.delete(key);
      }
    });
  }
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: number | null = null;

  return function(...args: Parameters<T>) {
    const now = Date.now();
    const elapsed = now - lastCall;

    if (elapsed >= delayMs) {
      lastCall = now;
      fn(...args);
    } else {
      // Schedule call for after delay
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timeoutId = null;
      }, delayMs - elapsed);
    }
  };
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return function(...args: Parameters<T>) {
    const callNow = immediate && timeoutId === null;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        fn(...args);
      }
    }, delayMs);

    if (callNow) {
      fn(...args);
    }
  };
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

/**
 * Get or create rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
    
    // Configure default limits
    rateLimiterInstance.configure('analytics', {
      maxRequests: 30, // 30 analytics events
      windowMs: 60000 // per minute
    });
    
    rateLimiterInstance.configure('api', {
      maxRequests: 10, // 10 API calls
      windowMs: 60000 // per minute
    });
    
    rateLimiterInstance.configure('haptics', {
      maxRequests: 100, // 100 haptic events
      windowMs: 1000 // per second
    });
    
    // Periodic cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => {
        rateLimiterInstance?.cleanup();
      }, 30000); // Every 30 seconds
    }
  }
  
  return rateLimiterInstance;
}

/**
 * Check if request is allowed (convenience function)
 */
export function isRateLimited(key: string = 'default'): boolean {
  return !getRateLimiter().isAllowed(key);
}

export { RateLimiter };

