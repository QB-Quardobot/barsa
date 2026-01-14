/**
 * Global Type Definitions
 * TYPESCRIPT BEST PRACTICES: Centralized type definitions for better type safety
 */

/**
 * Swiper.js type definitions
 * TYPESCRIPT: Proper interface instead of (window as any).Swiper
 */
export interface SwiperInstance {
  destroy: (deleteInstance?: boolean, cleanupStyles?: boolean) => void;
  slideTo: (index: number, speed?: number) => void;
  slideNext: (speed?: number) => void;
  slidePrev: (speed?: number) => void;
  update: () => void;
  updateSize: () => void;
  updateSlides: () => void;
  updateSlidesClasses: () => void;
  updateProgress: () => void;
  updateClickedSlide: (e: Event) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
  [key: string]: any; // Allow additional Swiper properties
}

export interface SwiperConstructor {
  new (container: HTMLElement | string, config?: SwiperConfig): SwiperInstance;
}

export interface SwiperConfig {
  slidesPerView?: number | 'auto';
  spaceBetween?: number;
  loop?: boolean;
  autoplay?: {
    delay?: number;
    disableOnInteraction?: boolean;
    pauseOnMouseEnter?: boolean;
  };
  pagination?: {
    el?: string | HTMLElement;
    clickable?: boolean;
    type?: 'bullets' | 'fraction' | 'progressbar' | 'custom';
    renderBullet?: (index: number, className: string) => string;
  };
  navigation?: {
    nextEl?: string | HTMLElement;
    prevEl?: string | HTMLElement;
  };
  breakpoints?: Record<number, Partial<SwiperConfig>>;
  on?: {
    init?: (swiper: SwiperInstance) => void;
    slideChange?: (swiper: SwiperInstance) => void;
    [key: string]: ((swiper: SwiperInstance, ...args: any[]) => void) | undefined;
  };
  [key: string]: any; // Allow additional Swiper config options
}

/**
 * Window extensions for global objects
 * TYPESCRIPT: Proper type definitions instead of (window as any)
 */
declare global {
  interface Window {
    // Swiper.js
    Swiper?: SwiperConstructor;
    
    // Reveal animations
    revealInstance?: {
      init: () => void;
      destroy: () => void;
      [key: string]: any;
    };
    initReveal?: () => void;
    
    // Telegram WebApp (already defined in telegram.ts, but kept for reference)
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: any;
        version?: string;
        platform?: string;
        colorScheme?: 'light' | 'dark';
        themeParams?: any;
        isExpanded?: boolean;
        viewportHeight?: number;
        viewportStableHeight?: number;
        headerColor?: string;
        backgroundColor?: string;
        isClosingConfirmationEnabled?: boolean;
        isVerticalSwipesEnabled?: boolean;
        isFullscreen?: boolean;
        isActive?: boolean;
        BackButton?: any;
        MainButton?: any;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        CloudStorage?: any;
        BiometricManager?: any;
        initData?: string;
        initDataUnsafe?: any;
        sendData?: (data: string) => void;
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        enableClosingConfirmation?: () => void;
        disableClosingConfirmation?: () => void;
        onEvent?: (eventType: string, eventHandler: () => void) => void;
        offEvent?: (eventType: string, eventHandler: () => void) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink?: (url: string) => void;
        openInvoice?: (url: string, callback?: (status: string) => void) => void;
        showPopup?: (params: any) => void;
        showAlert?: (message: string, callback?: () => void) => void;
        showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void;
        showScanQrPopup?: (params: any, callback?: (text: string) => void) => void;
        closeScanQrPopup?: () => void;
        readTextFromClipboard?: (callback?: (text: string) => void) => void;
        requestWriteAccess?: (callback?: (granted: boolean) => void) => void;
        requestContact?: (callback?: (granted: boolean) => void) => void;
        disableVerticalSwipes?: () => void;
        enableVerticalSwipes?: () => void;
        requestFullscreen?: () => void;
        [key: string]: any;
      };
    };
    
    // Error tracking
    __errorTracker?: (level: 'warn' | 'error', args: any[]) => void;
    __DEV__?: boolean;
    
    // Modal functions (for global access)
    closePhotoModal?: () => void;
    isPhotoModalOpen?: () => boolean;
    closeCurrencyModal?: () => void;
    isCurrencyModalOpen?: () => boolean;
    openOfferModal?: (tariffId: string, currency: 'rub' | 'eur', paymentUrl: string) => void;
    closeOfferModal?: () => void;
    isOfferModalOpen?: () => boolean;
  }
}

/**
 * Type guard for HTMLElement
 * TYPESCRIPT: Replace unsafe type assertions with type guards
 */
export function isHTMLElement(element: Element | null): element is HTMLElement {
  return element !== null && element instanceof HTMLElement;
}

/**
 * Type guard for HTMLImageElement
 * TYPESCRIPT: Replace unsafe type assertions with type guards
 */
export function isHTMLImageElement(element: Element | null): element is HTMLImageElement {
  return element !== null && element instanceof HTMLImageElement;
}

/**
 * Type guard for HTMLAnchorElement
 * TYPESCRIPT: Replace unsafe type assertions with type guards
 */
export function isHTMLAnchorElement(element: Element | null): element is HTMLAnchorElement {
  return element !== null && element instanceof HTMLAnchorElement;
}

/**
 * Type guard for Swiper availability
 * TYPESCRIPT: Type-safe check for Swiper library
 */
export function isSwiperAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.Swiper !== 'undefined';
}

/**
 * Get Swiper constructor with type safety
 * TYPESCRIPT: Type-safe access to Swiper
 */
export function getSwiperConstructor(): SwiperConstructor | null {
  if (isSwiperAvailable()) {
    return window.Swiper!;
  }
  return null;
}

/**
 * Type guard for Telegram WebApp
 * TYPESCRIPT: Type-safe check for Telegram WebApp
 */
export function isTelegramWebAppAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.Telegram !== 'undefined' && 
         typeof window.Telegram.WebApp !== 'undefined';
}

/**
 * Get Telegram WebApp with type safety
 * TYPESCRIPT: Type-safe access to Telegram WebApp
 */
export function getTelegramWebApp(): Window['Telegram']['WebApp'] | null {
  if (isTelegramWebAppAvailable()) {
    return window.Telegram!.WebApp!;
  }
  return null;
}

