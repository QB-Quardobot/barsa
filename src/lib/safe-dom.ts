/**
 * Safe DOM Utilities
 * ERROR HANDLING: Wrapper functions with try-catch and graceful degradation
 * Prevents errors from breaking the application
 */

/**
 * Safely query selector with error handling
 * ERROR HANDLING: Returns null on error instead of throwing
 */
export function safeQuerySelector<T extends Element = Element>(
  selector: string,
  root: Document | Element = document
): T | null {
  try {
    return root.querySelector<T>(selector);
  } catch (error) {
    // Graceful degradation: return null instead of throwing
    return null;
  }
}

/**
 * Safely query selector all with error handling
 * ERROR HANDLING: Returns empty NodeList on error instead of throwing
 */
export function safeQuerySelectorAll<T extends Element = Element>(
  selector: string,
  root: Document | Element = document
): NodeListOf<T> {
  try {
    return root.querySelectorAll<T>(selector);
  } catch (error) {
    // Graceful degradation: return empty NodeList
    return document.createDocumentFragment().querySelectorAll<T>(selector);
  }
}

/**
 * Safely get element by ID with error handling
 * ERROR HANDLING: Returns null on error instead of throwing
 */
export function safeGetElementById<T extends HTMLElement = HTMLElement>(
  id: string
): T | null {
  try {
    return document.getElementById(id) as T | null;
  } catch (error) {
    // Graceful degradation: return null instead of throwing
    return null;
  }
}

/**
 * Safely add event listener with error handling
 * ERROR HANDLING: Wrapped in try-catch, returns cleanup function
 */
export function safeAddEventListener<T extends EventTarget>(
  target: T,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): () => void {
  try {
    target.addEventListener(event, handler, options);
    // Return cleanup function
    return () => {
      try {
        target.removeEventListener(event, handler, options);
      } catch (e) {
        // Silently fail during cleanup
      }
    };
  } catch (error) {
    // Graceful degradation: return no-op cleanup function
    return () => {};
  }
}

/**
 * Safely access classList with error handling
 * ERROR HANDLING: Returns false on error instead of throwing
 */
export function safeClassListAdd(
  element: Element | null,
  className: string
): boolean {
  try {
    if (!element) return false;
    element.classList.add(className);
    return true;
  } catch (error) {
    // Graceful degradation: return false instead of throwing
    return false;
  }
}

/**
 * Safely remove from classList with error handling
 * ERROR HANDLING: Returns false on error instead of throwing
 */
export function safeClassListRemove(
  element: Element | null,
  className: string
): boolean {
  try {
    if (!element) return false;
    element.classList.remove(className);
    return true;
  } catch (error) {
    // Graceful degradation: return false instead of throwing
    return false;
  }
}

/**
 * Safely set style property with error handling
 * ERROR HANDLING: Returns false on error instead of throwing
 */
export function safeSetStyle(
  element: HTMLElement | null,
  property: string,
  value: string
): boolean {
  try {
    if (!element || !element.style) return false;
    element.style.setProperty(property, value);
    return true;
  } catch (error) {
    // Graceful degradation: return false instead of throwing
    return false;
  }
}

/**
 * Safely access storage with error handling
 * ERROR HANDLING: Returns null on error instead of throwing
 */
export function safeStorageGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }
    return window.sessionStorage.getItem(key);
  } catch (error) {
    // Graceful degradation: return null on error (e.g., iOS Safari private mode)
    return null;
  }
}

/**
 * Safely set storage item with error handling
 * ERROR HANDLING: Returns false on error instead of throwing
 */
export function safeStorageSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return false;
    }
    window.sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    // Graceful degradation: return false on error (e.g., iOS Safari private mode)
    return false;
  }
}

/**
 * Error Boundary: Wrap function execution with error handling
 * ERROR HANDLING: Catches errors and executes fallback if provided
 */
export function withErrorBoundary<T>(
  fn: () => T,
  fallback?: () => T,
  onError?: (error: Error) => void
): T | undefined {
  try {
    return fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (onError) {
      try {
        onError(err);
      } catch (e) {
        // Silently fail error handler
      }
    }
    if (fallback) {
      try {
        return fallback();
      } catch (e) {
        // Silently fail fallback
      }
    }
    return undefined;
  }
}

/**
 * Error Boundary: Wrap async function execution with error handling
 * ERROR HANDLING: Catches errors and executes fallback if provided
 */
export async function withErrorBoundaryAsync<T>(
  fn: () => Promise<T>,
  fallback?: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (onError) {
      try {
        onError(err);
      } catch (e) {
        // Silently fail error handler
      }
    }
    if (fallback) {
      try {
        return await fallback();
      } catch (e) {
        // Silently fail fallback
      }
    }
    return undefined;
  }
}

