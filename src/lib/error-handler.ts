/**
 * Global Error Handler
 * Centralized error handling and reporting
 */

import { logger } from './logger';

interface ErrorInfo {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
  stack?: string;
  userAgent?: string;
  url?: string;
  timestamp: number;
}

class ErrorHandler {
  private errorQueue: ErrorInfo[] = [];
  private maxQueueSize = 50;
  private isInitialized = false;

  /**
   * Initialize global error handlers
   */
  init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Handle synchronous errors
    window.onerror = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean => {
      this.handleError({
        message: typeof message === 'string' ? message : 'Unknown error',
        source,
        lineno,
        colno,
        error,
        stack: error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      });

      // Return false to allow default error handling
      return false;
    };

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.handleError({
        message: `Unhandled promise rejection: ${event.reason}`,
        error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      });

      // Prevent default browser error logging (we handle it)
      event.preventDefault();
    });

    // Handle resource loading errors
    window.addEventListener('error', (event: ErrorEvent) => {
      // Only handle script/resource errors, not general errors (handled by onerror)
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        this.handleError({
          message: `Resource loading error: ${target.tagName} - ${(target as any).src || (target as any).href || 'unknown'}`,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        });
      }
    }, true); // Use capture phase for resource errors

    logger.log('[ErrorHandler] Initialized');
  }

  /**
   * Handle an error
   */
  private handleError(errorInfo: ErrorInfo): void {
    // Add to queue
    this.errorQueue.push(errorInfo);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest
    }

    // Log error
    logger.error('[Error]', errorInfo.message, errorInfo.error || errorInfo);

    // Try to send to error tracking service if available
    this.reportError(errorInfo);
  }

  /**
   * Report error to external service
   */
  private reportError(errorInfo: ErrorInfo): void {
    // Check if custom error tracker is available
    if (typeof window !== 'undefined' && (window as any).__errorTracker) {
      try {
        (window as any).__errorTracker('error', errorInfo);
      } catch (e) {
        // Silently fail - don't break app if error reporting fails
      }
      return;
    }

    // If analytics is available, send error event
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.sendData) {
        tg.sendData(JSON.stringify({
          type: 'error',
          error: {
            message: errorInfo.message,
            source: errorInfo.source,
            stack: errorInfo.stack?.substring(0, 1000) // Limit stack trace size
          }
        }));
      }
    } catch (e) {
      // Silently fail
    }
  }

  /**
   * Manually report an error
   */
  report(message: string, error?: Error): void {
    this.handleError({
      message,
      error,
      stack: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  /**
   * Get error queue (for debugging)
   */
  getErrors(): ErrorInfo[] {
    return [...this.errorQueue];
  }

  /**
   * Clear error queue
   */
  clear(): void {
    this.errorQueue = [];
  }
}

// Singleton instance
let errorHandlerInstance: ErrorHandler | null = null;

/**
 * Get or create error handler instance
 */
export function getErrorHandler(): ErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler();
    if (typeof window !== 'undefined') {
      errorHandlerInstance.init();
    }
  }
  return errorHandlerInstance;
}

/**
 * Initialize error handling (call once)
 */
export function initErrorHandling(): void {
  getErrorHandler();
}

/**
 * Report an error manually
 */
export function reportError(message: string, error?: Error): void {
  getErrorHandler().report(message, error);
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  fallback?: T,
  errorMessage?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      reportError(errorMessage || `Error in ${fn.name || 'anonymous function'}`, error instanceof Error ? error : new Error(String(error)));
      if (fallback) {
        return fallback(...args);
      }
      throw error;
    }
  }) as T;
}

export { ErrorHandler };

