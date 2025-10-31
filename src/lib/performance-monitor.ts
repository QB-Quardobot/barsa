/**
 * Performance Monitor
 * Tracks Core Web Vitals and custom performance metrics
 * Based on Google's Web Vitals library principles
 */

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  entries?: PerformanceEntry[];
}

interface PerformanceConfig {
  logToConsole?: boolean;
  sendToAnalytics?: boolean;
  customThresholds?: {
    LCP?: number; // Largest Contentful Paint (ms)
    FID?: number; // First Input Delay (ms)
    CLS?: number; // Cumulative Layout Shift (score)
    FCP?: number; // First Contentful Paint (ms)
    TTFB?: number; // Time to First Byte (ms)
  };
}

// Default thresholds (Google's recommended)
const DEFAULT_THRESHOLDS = {
  LCP: 2500, // 2.5 seconds
  FID: 100,  // 100ms
  CLS: 0.1,  // 0.1 score
  FCP: 1800, // 1.8 seconds
  TTFB: 800  // 800ms
};

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: Map<string, Metric> = new Map();
  private observers: Array<PerformanceObserver | null> = [];

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      logToConsole: false,
      sendToAnalytics: true,
      customThresholds: {},
      ...config
    };

    this.thresholds = {
      ...DEFAULT_THRESHOLDS,
      ...this.config.customThresholds
    };
  }

  private thresholds = { ...DEFAULT_THRESHOLDS };

  /**
   * Measure Largest Contentful Paint (LCP)
   */
  measureLCP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };

        const value = lastEntry.renderTime || lastEntry.loadTime || 0;
        const rating = this.getRating('LCP', value);

        const metric: Metric = {
          name: 'LCP',
          value: Math.round(value),
          rating,
          id: lastEntry.startTime.toString(),
          entries: [lastEntry]
        };

        this.metrics.set('LCP', metric);
        this.reportMetric(metric);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (e) {
      // Silently fail if not supported
    }
  }

  /**
   * Measure First Input Delay (FID)
   */
  measureFID(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const value = entry.processingStart - entry.startTime;
          const rating = this.getRating('FID', value);

          const metric: Metric = {
            name: 'FID',
            value: Math.round(value),
            rating,
            id: entry.startTime.toString(),
            entries: [entry]
          };

          this.metrics.set('FID', metric);
          this.reportMetric(metric);
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (e) {
      // Silently fail if not supported
    }
  }

  /**
   * Measure Cumulative Layout Shift (CLS)
   */
  measureCLS(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        });

        const rating = this.getRating('CLS', clsValue);

        const metric: Metric = {
          name: 'CLS',
          value: Math.round(clsValue * 1000) / 1000, // Round to 3 decimals
          rating,
          id: Date.now().toString(),
          entries: clsEntries
        };

        this.metrics.set('CLS', metric);
        this.reportMetric(metric);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (e) {
      // Silently fail if not supported
    }
  }

  /**
   * Measure First Contentful Paint (FCP)
   */
  measureFCP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(
          entry => entry.name === 'first-contentful-paint'
        );

        if (fcpEntry) {
          const value = fcpEntry.startTime;
          const rating = this.getRating('FCP', value);

          const metric: Metric = {
            name: 'FCP',
            value: Math.round(value),
            rating,
            id: fcpEntry.startTime.toString(),
            entries: [fcpEntry]
          };

          this.metrics.set('FCP', metric);
          this.reportMetric(metric);
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (e) {
      // Silently fail if not supported
    }
  }

  /**
   * Measure Time to First Byte (TTFB)
   */
  measureTTFB(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const value = navigationEntry.responseStart - navigationEntry.requestStart;
        const rating = this.getRating('TTFB', value);

        const metric: Metric = {
          name: 'TTFB',
          value: Math.round(value),
          rating,
          id: Date.now().toString(),
          entries: [navigationEntry]
        };

        this.metrics.set('TTFB', metric);
        this.reportMetric(metric);
      }
    } catch (e) {
      // Silently fail if not supported
    }
  }

  /**
   * Get rating for a metric
   */
  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[metricName as keyof typeof this.thresholds];
    if (!threshold) return 'good';

    // Different logic for CLS (lower is better)
    if (metricName === 'CLS') {
      if (value <= threshold * 0.75) return 'good';
      if (value <= threshold) return 'needs-improvement';
      return 'poor';
    }

    // For others, lower is better
    if (value <= threshold * 0.75) return 'good';
    if (value <= threshold) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Report metric to analytics/console
   */
  private reportMetric(metric: Metric): void {
    if (this.config.logToConsole) {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`${emoji} ${metric.name}: ${metric.value}ms (${metric.rating})`);
    }

    if (this.config.sendToAnalytics && typeof window !== 'undefined') {
      // Send to GA4 if available
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: metric.name,
          value: metric.value,
          metric_rating: metric.rating,
          non_interaction: true
        });
      }

      // Send to Yandex Metrika if available
      if (window.ym) {
        window.ym(0, 'reachGoal', 'web_vital', {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating
        });
      }

      // Send to Telegram WebApp if available
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.sendData) {
        try {
          tg.sendData(JSON.stringify({
            type: 'performance',
            metric: metric.name,
            value: metric.value,
            rating: metric.rating,
            timestamp: Date.now()
          }));
        } catch (e) {
          // Silently fail
        }
      }
    }
  }

  /**
   * Initialize all measurements
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Measure all Core Web Vitals
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureFCP();
    this.measureTTFB();
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): Map<string, Metric> {
    return new Map(this.metrics);
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Destroy observers
   */
  destroy(): void {
    this.observers.forEach(observer => {
      if (observer) {
        try {
          observer.disconnect();
        } catch (e) {
          // Silently fail
        }
      }
    });
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * Get or create performance monitor instance
 */
export function getPerformanceMonitor(config?: PerformanceConfig): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(config);
    
    // Auto-initialize when DOM is ready
    if (typeof window !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          performanceMonitorInstance?.init();
        });
      } else {
        performanceMonitorInstance.init();
      }
    }
  }
  
  return performanceMonitorInstance;
}

export { PerformanceMonitor, Metric, PerformanceConfig };

