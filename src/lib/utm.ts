/**
 * UTM Parameters Manager
 * Parses UTM from URL and stores in sessionStorage
 */

const STORAGE_KEY = 'utm_params';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

/**
 * Parse UTM parameters from URL
 */
export function parseUTMFromURL(url?: string): UTMParams {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const searchParams = new URLSearchParams(targetUrl.split('?')[1] || '');
  
  const utmParams: UTMParams = {};
  
  UTM_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) {
      utmParams[key as keyof UTMParams] = value;
    }
  });
  
  return utmParams;
}

/**
 * Store UTM parameters in sessionStorage
 */
export function storeUTM(utmParams: UTMParams): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utmParams));
  } catch (error) {
    console.warn('Failed to store UTM params:', error);
  }
}

/**
 * Retrieve UTM parameters from sessionStorage
 */
export function getStoredUTM(): UTMParams {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to retrieve UTM params:', error);
    return {};
  }
}

/**
 * Initialize UTM tracking
 * Parses UTM from current URL and stores in sessionStorage
 */
export function initUTM(): void {
  if (typeof window === 'undefined') return;
  
  const utmParams = parseUTMFromURL(window.location.href);
  
  // Only store if we have at least one UTM parameter
  if (Object.keys(utmParams).length > 0) {
    storeUTM(utmParams);
  }
}

/**
 * Add UTM parameters to any URL
 * Uses stored UTM params from sessionStorage
 */
export function withUTM(url: string): string {
  if (!url) return url;
  
  const utmParams = getStoredUTM();
  
  // If no UTM params stored, return original URL
  if (Object.keys(utmParams).length === 0) {
    return url;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Add UTM params to URL
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value && !urlObj.searchParams.has(key)) {
        urlObj.searchParams.set(key, value);
      }
    });
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, append params manually
    const separator = url.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    return `${url}${separator}${params.toString()}`;
  }
}

/**
 * Clear stored UTM parameters
 */
export function clearUTM(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear UTM params:', error);
  }
}
