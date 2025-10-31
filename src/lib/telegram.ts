/**
 * Telegram Web App API - Type-safe wrapper
 * Official API: https://core.telegram.org/bots/webapps
 */

export interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface ColorScheme {
  colorScheme: 'light' | 'dark';
}

export interface WebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: ThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  // Bot API 7.7+
  isVerticalSwipesEnabled: boolean;
  // Bot API 8.0+
  isFullscreen: boolean;
  isActive: boolean;
  BackButton: BackButton;
  MainButton: MainButton;
  HapticFeedback: HapticFeedback;
  CloudStorage: any;
  biometricsInitData?: string;
  isReady: boolean;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  openInvoice(url: string, callback?: (status: string) => void): void;
  showPopup(params: PopupParams, callback?: (id: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  showScanQrPopup(params: ScanQrPopupParams, callback?: (data: string) => void): void;
  closeScanQrPopup(): void;
  readTextFromClipboard(callback?: (text: string) => void): void;
  requestWriteAccess(callback?: (granted: boolean) => void): void;
  requestContact(callback?: (granted: boolean) => void): void;
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  // Bot API 7.7+ - Vertical swipes control
  enableVerticalSwipes(): void;
  disableVerticalSwipes(): void;
  // Bot API 8.0+ - Fullscreen mode
  requestFullscreen(): void;
  exitFullscreen(): void;
  setHeaderColor(color: 'bg_color' | 'secondary_bg_color' | string): void;
  setBackgroundColor(color: string): void;
  onEvent(eventType: string, eventHandler: Function): void;
  offEvent(eventType: string, eventHandler: Function): void;
  sendData(data: string): void;
  switchInlineQuery(query: string, choose_chat_types?: string[]): void;
}

export interface BackButton {
  isVisible: boolean;
  onClick(callback: () => void): void;
  show(): void;
  hide(): void;
}

export interface MainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText(text: string): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
  show(): void;
  hide(): void;
  enable(): void;
  disable(): void;
  showProgress(leaveActive?: boolean): void;
  hideProgress(): void;
  setParams(params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }): void;
}

export interface HapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

export interface PopupParams {
  title?: string;
  message: string;
  buttons?: PopupButton[];
}

export interface PopupButton {
  id?: string;
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
  text?: string;
}

export interface ScanQrPopupParams {
  text?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}

/**
 * Check if running in Telegram Web App
 */
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined;
}

/**
 * Get Telegram Web App instance
 */
export function getWebApp(): WebApp | null {
  return window.Telegram?.WebApp ?? null;
}

/**
 * Initialize Telegram Web App
 */
export function initTelegramWebApp(): void {
  if (!isTelegramWebApp()) return;
  
  const webApp = getWebApp();
  if (!webApp) return;
  
  // Initialize and expand
  webApp.ready();
  webApp.expand();
  
  // Enable closing confirmation
  webApp.enableClosingConfirmation();
  
  // Bot API 7.7+: Disable vertical swipes to prevent accidental closing
  if (typeof webApp.disableVerticalSwipes === 'function') {
    webApp.disableVerticalSwipes();
  }
  
  // Bot API 8.0+: Request fullscreen mode for immersive experience
  if (typeof webApp.requestFullscreen === 'function') {
    try {
      webApp.requestFullscreen();
    } catch (e) {
      // Silently fail in production
      if (typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname.includes('.ngrok.io'))) {
        console.warn('Fullscreen request failed:', e);
      }
    }
  }
}

/**
 * Get current theme color scheme from Telegram
 */
export function getTelegramTheme(): 'light' | 'dark' {
  const webApp = getWebApp();
  if (!webApp) return 'dark';
  
  return webApp.colorScheme;
}

/**
 * Subscribe to theme changes
 */
export function onThemeChanged(callback: (theme: 'light' | 'dark') => void): void {
  const webApp = getWebApp();
  if (!webApp) return;
  
  webApp.onEvent('themeChanged', () => {
    callback(webApp.colorScheme);
  });
}

/**
 * Apply Telegram theme colors to CSS
 */
export function applyTelegramTheme(): void {
  const webApp = getWebApp();
  if (!webApp) return;
  
  const themeParams = webApp.themeParams;
  
  if (themeParams.bg_color) {
    document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
  }
  if (themeParams.text_color) {
    document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
  }
  if (themeParams.hint_color) {
    document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
  }
  if (themeParams.link_color) {
    document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color);
  }
  if (themeParams.button_color) {
    document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color);
  }
  if (themeParams.button_text_color) {
    document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
  }
  if (themeParams.secondary_bg_color) {
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);
  }
}

/**
 * Open link in Telegram Web App context
 * Uses Telegram.WebApp.openLink if in Telegram, otherwise regular link
 */
export function openLink(url: string, tryInstantView: boolean = false): void {
  const webApp = getWebApp();
  
  if (webApp) {
    // In Telegram - use WebApp API
    webApp.openLink(url, { try_instant_view: tryInstantView });
  } else {
    // Not in Telegram - open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Send haptic feedback
 */
export function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  const webApp = getWebApp();
  if (!webApp) return;
  
  webApp.HapticFeedback.impactOccurred(style);
}

/**
 * Close Telegram Web App
 */
export function closeTelegramWebApp(): void {
  const webApp = getWebApp();
  if (!webApp) return;
  
  webApp.close();
}

