/**
 * 24-hour Countdown Timer
 * Vanilla TypeScript implementation with Page Visibility API support
 */

export interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export class CountdownTimer {
  private deadline: Date;
  private updateInterval: number | null = null;
  private isRunning: boolean = false;
  private callbacks: Array<(state: CountdownState) => void> = [];
  
  constructor(deadlineISO: string) {
    this.deadline = new Date(deadlineISO);
    
    if (isNaN(this.deadline.getTime())) {
      throw new Error(`Invalid deadline date: ${deadlineISO}`);
    }
    
    this.setupVisibilityListener();
  }
  
  /**
   * Calculate time remaining until deadline
   */
  private calculateRemaining(): CountdownState {
    const now = new Date();
    const diff = this.deadline.getTime() - now.getTime();
    
    if (diff <= 0) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true
      };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
      hours,
      minutes,
      seconds,
      expired: false
    };
  }
  
  /**
   * Subscribe to countdown updates
   */
  subscribe(callback: (state: CountdownState) => void): () => void {
    this.callbacks.push(callback);
    
    // Immediately call with current state
    callback(this.calculateRemaining());
    
    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Start the countdown timer
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    this.updateInterval = window.setInterval(() => {
      const state = this.calculateRemaining();
      
      this.callbacks.forEach(callback => {
        callback(state);
      });
      
      if (state.expired) {
        this.stop();
      }
    }, 1000);
  }
  
  /**
   * Stop the countdown timer
   */
  stop(): void {
    if (this.updateInterval !== null) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
  }
  
  private visibilityHandler: (() => void) | null = null;
  
  /**
   * Setup Page Visibility API listener
   * Pauses timer when tab is hidden
   */
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;
    
    let wasRunningBeforeHidden = false;
    
    this.visibilityHandler = () => {
      if (document.hidden) {
        // Tab is hidden - remember state and stop
        wasRunningBeforeHidden = this.isRunning;
        this.stop();
      } else if (wasRunningBeforeHidden) {
        // Tab is visible again - resume if it was running
        this.start();
        wasRunningBeforeHidden = false;
        
        // Update immediately with current state
        const state = this.calculateRemaining();
        this.callbacks.forEach(callback => {
          callback(state);
        });
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
  
  /**
   * Check if deadline is expired
   */
  isExpired(): boolean {
    return this.calculateRemaining().expired;
  }
  
  /**
   * Destroy the timer (cleanup)
   */
  destroy(): void {
    this.stop();
    this.callbacks = [];
    
    // Remove visibility listener
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}

/**
 * Format number with leading zero
 */
export function formatNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Get ARIA live region text for screen readers
 */
export function getAriaText(state: CountdownState): string {
  if (state.expired) {
    return 'Время истекло';
  }
  
  const parts: string[] = [];
  
  if (state.hours > 0) {
    parts.push(`${state.hours} ${state.hours === 1 ? 'час' : state.hours < 5 ? 'часа' : 'часов'}`);
  }
  
  if (state.minutes > 0 || state.hours === 0) {
    parts.push(`${state.minutes} ${state.minutes === 1 ? 'минута' : state.minutes < 5 ? 'минуты' : 'минут'}`);
  }
  
  if (state.seconds >= 0) {
    parts.push(`${state.seconds} ${state.seconds === 1 ? 'секунда' : state.seconds < 5 ? 'секунды' : 'секунд'}`);
  }
  
  return `Осталось: ${parts.join(', ')}`;
}
