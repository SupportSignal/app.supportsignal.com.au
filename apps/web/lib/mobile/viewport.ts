/**
 * Mobile viewport detection and utilities
 * Story 3.5: Mobile-First Responsive Incident Capture
 */

// Mobile-first responsive breakpoints
export const BREAKPOINTS = {
  mobile: 375,    // Minimum mobile support (iPhone SE)
  tablet: 768,    // Tablet landscape mode
  desktop: 1024,  // Desktop and larger screens
  wide: 1440      // Large desktop displays
} as const;

export type ViewportType = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Detect current viewport type based on window width
 */
export function getViewportType(): ViewportType {
  if (typeof window === 'undefined') return 'desktop'; // SSR fallback
  
  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  if (width < BREAKPOINTS.wide) return 'desktop';
  return 'wide';
}

/**
 * Check if current viewport is mobile
 */
export function isMobileViewport(): boolean {
  return getViewportType() === 'mobile';
}

/**
 * Check if current viewport is tablet or smaller
 */
export function isTabletOrSmaller(): boolean {
  const viewportType = getViewportType();
  return viewportType === 'mobile' || viewportType === 'tablet';
}

/**
 * Check if touch is available (mobile/tablet)
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         // @ts-ignore - msMaxTouchPoints is legacy IE property
         navigator.msMaxTouchPoints > 0;
}

/**
 * Get mobile-optimized CSS classes based on viewport
 */
export function getMobileClasses(baseClasses: string, mobileClasses?: string): string {
  if (!mobileClasses) return baseClasses;
  
  if (typeof window === 'undefined') return baseClasses;
  
  return isMobileViewport() ? `${baseClasses} ${mobileClasses}` : baseClasses;
}

/**
 * Viewport orientation detection
 */
export function getOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';
  
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Check if device is in landscape mode
 */
export function isLandscape(): boolean {
  return getOrientation() === 'landscape';
}