/**
 * Production-safe logger
 * Automatically removes console.log in production builds
 * DRY: Uses shared utility for development check
 */

import { isDevelopment, isProduction } from './utils';

/**
 * Production-safe console.log
 * Automatically disabled in production
 */
export const logger = {
  log: (...args: any[]): void => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },
  warn: (...args: any[]): void => {
    if (isDevelopment()) {
      console.warn(...args);
    } else {
      // In production, log warnings to error tracking (if available)
      // This allows critical warnings to be monitored
      if (typeof window !== 'undefined' && (window as any).__errorTracker) {
        try {
          (window as any).__errorTracker('warn', args);
        } catch {}
      }
    }
  },
  error: (...args: any[]): void => {
    // Always log errors, even in production (but format safely)
    if (isProduction()) {
      // In production, send to error tracking service
      if (typeof window !== 'undefined' && (window as any).__errorTracker) {
        try {
          (window as any).__errorTracker('error', args);
        } catch {}
      }
    } else {
      console.error(...args);
    }
  },
  debug: (...args: any[]): void => {
    if (isDevelopment()) {
      console.log('[DEBUG]', ...args);
    }
  }
};

/**
 * Safely execute function with error handling
 */
export function safeExecute<T>(
  fn: () => T,
  fallback: T,
  errorMessage?: string
): T {
  try {
    return fn();
  } catch (error) {
    if (errorMessage) {
      logger.error(errorMessage, error);
    }
    return fallback;
  }
}

/**
 * Safely execute async function with error handling
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorMessage) {
      logger.error(errorMessage, error);
    }
    return fallback;
  }
}

