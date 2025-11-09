/**
 * Analytics Module for Click Tracking
 * 
 * Tracks CTA clicks, stores locally, and sends to Telegram bot/server.
 * 
 * Features:
 * - Local storage (sessionStorage/localStorage)
 * - Telegram WebApp sendData() integration
 * - Batch sending to reduce requests
 * - Metadata collection (UTM, platform, device)
 * - Fallback for browsers without Telegram API
 * 
 * Usage:
 * ```ts
 * import { trackClick, flushEvents, getStats } from './lib/analytics';
 * 
 * trackClick({
 *   type: 'cta',
 *   label: 'Вступить',
 *   href: 'https://t.me/channel'
 * });
 * ```
 */

// DRY: Use shared logger instead of duplicating
import { logger } from './logger';

export interface ClickEvent {
  type: 'cta' | 'link' | 'button' | 'other';
  label: string;
  href: string;
  timestamp: number;
  sessionId: string;
  userId?: string; // Telegram user ID if available
  platform?: string; // 'ios' | 'android' | 'web' | 'unknown'
  version?: string; // Telegram WebApp version
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  scrollDepth?: number; // Percentage of page scrolled
}

interface AnalyticsConfig {
  storageKey: string;
  batchSize: number;
  flushInterval: number; // ms
  maxLocalEvents: number;
  enableTelegram: boolean;
  enableServer: boolean;
  serverEndpoint?: string;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  storageKey: 'analytics_events',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  maxLocalEvents: 100,
  enableTelegram: true,
  enableServer: false,
  serverEndpoint: undefined,
};

class AnalyticsTracker {
  private config: AnalyticsConfig;
  private events: ClickEvent[] = [];
  private flushTimer: number | null = null;
  private sessionId: string;
  private telegramWebApp: any = null;
  
  // Rate limiter for analytics (prevents spam)
  private rateLimiter = (function() {
    const requests = new Map();
    const maxRequests = 30; // 30 events per minute
    const windowMs = 60000;
    
    function isAllowed() {
      const now = Date.now();
      const key = 'analytics';
      let record = requests.get(key);
      
      if (!record) {
        record = { timestamps: [] };
        requests.set(key, record);
      }
      
      record.timestamps = record.timestamps.filter((ts: number) => now - ts < windowMs);
      
      if (record.timestamps.length < maxRequests) {
        record.timestamps.push(now);
        return true;
      }
      
      return false;
    }
    
    return { isAllowed };
  })();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.getOrCreateSessionId();
    this.initTelegram();
    this.loadStoredEvents();
    this.startAutoFlush();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server-' + Date.now();
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private initTelegram(): void {
    if (typeof window === 'undefined') return;
    
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      this.telegramWebApp = tg;
    }
  }

  private loadStoredEvents(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = sessionStorage.getItem(this.config.storageKey);
      if (stored) {
        this.events = JSON.parse(stored);
        // Limit to maxLocalEvents
        if (this.events.length > this.config.maxLocalEvents) {
          this.events = this.events.slice(-this.config.maxLocalEvents);
        }
      }
    } catch (e) {
      logger.warn('[Analytics] Failed to load stored events:', e);
    }
  }

  private saveEvents(): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(this.config.storageKey, JSON.stringify(this.events));
    } catch (e) {
      logger.warn('[Analytics] Failed to save events (storage full?)', e);
      // Remove oldest events if storage is full
      if (this.events.length > 10) {
        this.events = this.events.slice(-10);
        try {
          sessionStorage.setItem(this.config.storageKey, JSON.stringify(this.events));
        } catch {}
      }
    }
  }

  private getUTMParams(): Partial<ClickEvent> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = sessionStorage.getItem('utm_params');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {};
  }

  private getMetadata(): Partial<ClickEvent> {
    if (typeof window === 'undefined') return {};
    
    const metadata: Partial<ClickEvent> = {
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scrollDepth: this.getScrollDepth(),
    };

    // Telegram-specific
    if (this.telegramWebApp) {
      metadata.userId = this.telegramWebApp.initDataUnsafe?.user?.id?.toString();
      metadata.platform = this.telegramWebApp.platform;
      metadata.version = this.telegramWebApp.version;
    } else {
      // Detect platform from userAgent
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('iphone') || ua.includes('ipad')) {
        metadata.platform = 'ios';
      } else if (ua.includes('android')) {
        metadata.platform = 'android';
      } else {
        metadata.platform = 'web';
      }
    }

    return metadata;
  }

  private getScrollDepth(): number {
    if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return Math.round((scrollTop / docHeight) * 100);
  }

  /**
   * Track a click event
   */
  trackClick(data: {
    type: ClickEvent['type'];
    label: string;
    href: string;
  }): void {
    const event: ClickEvent = {
      ...data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...this.getUTMParams(),
      ...this.getMetadata(),
    };

    this.events.push(event);
    this.saveEvents();

    // Send immediately to Telegram if available (reliable)
    if (this.config.enableTelegram && this.telegramWebApp) {
      this.sendToTelegram(event);
    }

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Send event to Telegram bot via sendData()
   */
  private sendToTelegram(event: ClickEvent): void {
    if (!this.telegramWebApp || typeof this.telegramWebApp.sendData !== 'function') {
      return;
    }

    // Apply rate limiting
    if (!this.rateLimiter.isAllowed()) {
      // Silently drop if rate limited (events are still stored locally)
      return;
    }

    try {
      // Send compact version to reduce payload
      const payload = {
        event: 'click',
        type: event.type,
        label: event.label,
        href: event.href,
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        userId: event.userId,
        platform: event.platform,
        ...(event.utm_source && { utm_source: event.utm_source }),
        ...(event.utm_campaign && { utm_campaign: event.utm_campaign }),
      };

      this.telegramWebApp.sendData(JSON.stringify(payload));
      } catch (e) {
        logger.warn('[Analytics] Failed to send to Telegram:', e);
      }
  }

  /**
   * Send events to server endpoint
   */
  private async sendToServer(events: ClickEvent[]): Promise<void> {
    if (!this.config.enableServer || !this.config.serverEndpoint || events.length === 0) {
      return;
    }

    try {
      // Use sendBeacon for reliable delivery (doesn't block page unload)
      if (navigator.sendBeacon && typeof window !== 'undefined') {
        const blob = new Blob([JSON.stringify(events)], { type: 'application/json' });
        navigator.sendBeacon(this.config.serverEndpoint, blob);
      } else {
        // Fallback to fetch
        await fetch(this.config.serverEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(events),
          keepalive: true, // For reliability on page unload
        });
      }
      } catch (e) {
        logger.warn('[Analytics] Failed to send to server:', e);
      }
  }

  /**
   * Flush all pending events to server
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    
    // Clear events after copying
    this.events = [];
    this.saveEvents();

    // Send to server if enabled
    if (this.config.enableServer) {
      await this.sendToServer(eventsToSend);
    }
  }

  /**
   * Auto-flush on interval
   */
  private startAutoFlush(): void {
    if (typeof window === 'undefined') return;
    
    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush (call on page unload)
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Final flush on destroy
    this.flush();
  }

  /**
   * Get statistics for current session
   */
  getStats(): {
    totalClicks: number;
    clicksByType: Record<string, number>;
    clicksByLabel: Record<string, number>;
    clicksByHour: Record<string, number>;
    uniqueUrls: number;
    avgScrollDepth: number;
    platforms: Record<string, number>;
  } {
    const stats = {
      totalClicks: this.events.length,
      clicksByType: {} as Record<string, number>,
      clicksByLabel: {} as Record<string, number>,
      clicksByHour: {} as Record<string, number>,
      uniqueUrls: new Set<string>().size,
      avgScrollDepth: 0,
      platforms: {} as Record<string, number>,
    };

    const urlSet = new Set<string>();
    let totalScrollDepth = 0;

    this.events.forEach((event) => {
      // By type
      stats.clicksByType[event.type] = (stats.clicksByType[event.type] || 0) + 1;
      
      // By label
      stats.clicksByLabel[event.label] = (stats.clicksByLabel[event.label] || 0) + 1;
      
      // By hour
      const hour = new Date(event.timestamp).getHours();
      const hourKey = `${hour}:00`;
      stats.clicksByHour[hourKey] = (stats.clicksByHour[hourKey] || 0) + 1;
      
      // Unique URLs
      urlSet.add(event.href);
      
      // Scroll depth
      if (event.scrollDepth) {
        totalScrollDepth += event.scrollDepth;
      }
      
      // Platforms
      const platform = event.platform || 'unknown';
      stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
    });

    stats.uniqueUrls = urlSet.size;
    stats.avgScrollDepth = this.events.length > 0 ? Math.round(totalScrollDepth / this.events.length) : 0;

    return stats;
  }

  /**
   * Get all events (for debugging)
   */
  getAllEvents(): ClickEvent[] {
    return [...this.events];
  }
}

// Singleton instance
let analyticsInstance: AnalyticsTracker | null = null;

/**
 * Initialize analytics (call once)
 */
export function initAnalytics(config?: Partial<AnalyticsConfig>): AnalyticsTracker {
  if (typeof window === 'undefined') {
    // Server-side: return mock
    return null as any;
  }
  
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsTracker(config);
    
    // Auto-flush on page unload
    window.addEventListener('beforeunload', () => {
      analyticsInstance?.flush();
    });
    
    // Also flush on visibility change (mobile app backgrounding)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        analyticsInstance?.flush();
      }
    });
  }
  
  return analyticsInstance;
}

/**
 * Track a click event
 */
export function trackClick(data: {
  type: ClickEvent['type'];
  label: string;
  href: string;
}): void {
  if (typeof window === 'undefined') return;
  
  if (!analyticsInstance) {
    initAnalytics();
  }
  
  analyticsInstance?.trackClick(data);
}

/**
 * Flush pending events
 */
export async function flushEvents(): Promise<void> {
  if (typeof window === 'undefined') return;
  await analyticsInstance?.flush();
}

/**
 * Get analytics statistics
 */
export function getStats() {
  if (typeof window === 'undefined') return null;
  return analyticsInstance?.getStats();
}

/**
 * Get all events (for debugging)
 */
export function getAllEvents(): ClickEvent[] {
  if (typeof window === 'undefined') return [];
  return analyticsInstance?.getAllEvents() || [];
}

