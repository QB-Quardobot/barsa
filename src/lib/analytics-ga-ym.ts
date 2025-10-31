/**
 * Google Analytics 4 & Яндекс.Метрика Integration
 * 
 * Простая интеграция для отслеживания UTM меток и кликов
 * Работает в Telegram Mini App и обычном браузере
 * 
 * Usage:
 * - Set GA4_MEASUREMENT_ID in .env (or via Astro.env)
 * - Set YM_COUNTER_ID in .env (or via Astro.env)
 * - UTM parameters are automatically tracked from URL
 * - CTA clicks are automatically tracked
 */

// Production-safe logger
const isDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.includes('.ngrok.io') ||
   window.location.hostname.includes('.trycloudflare.com'));

const logger = {
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  }
};

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    ym?: {
      (counterId: number, action: string, target: string, params?: Record<string, any>): void;
      a?: Array<[number, string, string, Record<string, any>?]>;
      l?: number;
    };
    dataLayer?: any[];
  }
}

export interface AnalyticsConfig {
  ga4Id?: string | null; // G-XXXXXXXXXX
  ymId?: string | null;  // 12345678
  enabled: boolean;
}

/**
 * Initialize Google Analytics 4
 */
export function initGA4(measurementId: string): void {
  if (typeof window === 'undefined') return;

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  window.gtag = function() {
    if (window.dataLayer) {
      window.dataLayer.push(arguments);
    }
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: true,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/**
 * Initialize Яндекс.Метрика
 */
export function initYandexMetrika(counterId: string | number): void {
  if (typeof window === 'undefined') return;

  const id = Number(counterId);

  // Create ym function (Yandex Metrika pattern)
  const ymFunction = function(this: any, id: number, action: string, target: string, params?: Record<string, any>) {
    if (!this.a) {
      this.a = [];
    }
    this.a.push([id, action, target, params]);
  } as Window['ym'];
  
  (ymFunction as any).a = [];
  (ymFunction as any).l = Date.now();
  window.ym = ymFunction;

  // Create and append script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://mc.yandex.ru/metrika/tag.js`;
  document.head.appendChild(script);

  // Initialize counter
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<div><img src="https://mc.yandex.ru/watch/${id}" style="position:absolute; left:-9999px;" alt="" /></div>`;
  document.body.appendChild(noscript);

  // Initialize (Yandex Metrika accepts object as 4th parameter, not 3rd)
  if (window.ym) {
    window.ym(id, 'init', '', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      ecommerce: 'dataLayer',
    });
  }
}

/**
 * Track page view with UTM parameters
 */
export function trackPageView(utmParams?: Record<string, string>): void {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const currentUtm = {
    source: urlParams.get('utm_source'),
    medium: urlParams.get('utm_medium'),
    campaign: urlParams.get('utm_campaign'),
    term: urlParams.get('utm_term'),
    content: urlParams.get('utm_content'),
    ...utmParams,
  };

  // GA4: Track page view with UTM
  if (window.gtag) {
    window.gtag('config', window.dataLayer?.[1]?.[1] || '', {
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
      ...(currentUtm.source && { utm_source: currentUtm.source }),
      ...(currentUtm.medium && { utm_medium: currentUtm.medium }),
      ...(currentUtm.campaign && { utm_campaign: currentUtm.campaign }),
      ...(currentUtm.term && { utm_term: currentUtm.term }),
      ...(currentUtm.content && { utm_content: currentUtm.content }),
    });
  }

  // Яндекс.Метрика: Track page view (UTM automatically tracked from URL)
  if (window.ym && window.ym.a && window.ym.a.length > 0 && window.ym.a[0] && window.ym.a[0][0]) {
    const ymId = window.ym.a[0][0];
    if (window.ym) {
      window.ym(ymId, 'hit', window.location.href, {
        title: document.title,
      });
    }
  }
}

/**
 * Track CTA click event
 */
export function trackCTAClick(data: {
  label: string;
  href: string;
  location?: string; // Where on page the button is located
}): void {
  if (typeof window === 'undefined') return;

  // Get UTM from sessionStorage or URL
  let utmParams: Record<string, string> = {};
  try {
    const stored = sessionStorage.getItem('utm_params');
    if (stored) {
      utmParams = JSON.parse(stored);
    }
  } catch {}

  // GA4: Track click event
  if (window.gtag) {
    window.gtag('event', 'cta_click', {
      event_category: 'CTA',
      event_label: data.label,
      link_url: data.href,
      link_location: data.location || 'unknown',
      ...utmParams,
    });
  }

  // Яндекс.Метрика: Track goal (replace 'cta_click' with your goal name)
  if (window.ym && window.ym.a && window.ym.a.length > 0 && window.ym.a[0] && window.ym.a[0][0]) {
    const ymId = window.ym.a[0][0];
    window.ym(ymId, 'reachGoal', 'cta_click', {
      label: data.label,
      href: data.href,
      location: data.location,
    });
  }
}

/**
 * Track scroll depth (optional)
 */
export function trackScrollDepth(depth: number): void {
  if (typeof window === 'undefined') return;

  // GA4: Track scroll event (only at 25%, 50%, 75%, 100%)
  if (window.gtag && (depth === 25 || depth === 50 || depth === 75 || depth === 100)) {
    window.gtag('event', 'scroll', {
      event_category: 'Engagement',
      value: depth,
    });
  }
}

/**
 * Initialize analytics with config
 */
export function initAnalytics(config: AnalyticsConfig): void {
  if (typeof window === 'undefined' || !config.enabled) return;

  // Initialize GA4
  if (config.ga4Id) {
    try {
      initGA4(config.ga4Id);
    } catch (e) {
      logger.warn('[Analytics] Failed to init GA4:', e);
    }
  }

  // Initialize Яндекс.Метрика
  if (config.ymId) {
    try {
      initYandexMetrika(config.ymId);
    } catch (e) {
      logger.warn('[Analytics] Failed to init Yandex Metrika:', e);
    }
  }

  // Track initial page view after a short delay (to allow UTM to be stored)
  setTimeout(() => {
    try {
      trackPageView();
    } catch (e) {
      logger.warn('[Analytics] Failed to track page view:', e);
    }
  }, 100);
}

