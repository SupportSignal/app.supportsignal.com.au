/**
 * React hook for viewport detection and responsive behavior
 * Story 3.5: Mobile-First Responsive Incident Capture
 */

import { useState, useEffect } from 'react';
import { getViewportType, isMobileViewport, isTabletOrSmaller, isTouchDevice, getOrientation, ViewportType } from '@/lib/mobile/viewport';

export interface ViewportInfo {
  type: ViewportType;
  width: number;
  height: number;
  isMobile: boolean;
  isTabletOrSmaller: boolean;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
}

/**
 * Hook to track viewport changes and provide responsive information
 */
export function useViewport(): ViewportInfo {
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>(() => {
    // Initial state for SSR compatibility
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        width: 1024,
        height: 768,
        isMobile: false,
        isTabletOrSmaller: false,
        isTouchDevice: false,
        orientation: 'landscape'
      };
    }
    
    return {
      type: getViewportType(),
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: isMobileViewport(),
      isTabletOrSmaller: isTabletOrSmaller(),
      isTouchDevice: isTouchDevice(),
      orientation: getOrientation()
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      setViewportInfo({
        type: getViewportType(),
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: isMobileViewport(),
        isTabletOrSmaller: isTabletOrSmaller(),
        isTouchDevice: isTouchDevice(),
        orientation: getOrientation()
      });
    };

    // Update on mount to ensure client-side values
    updateViewport();

    // Listen for resize events
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return viewportInfo;
}

/**
 * Hook specifically for mobile detection
 */
export function useMobile(): boolean {
  const { isMobile } = useViewport();
  return isMobile;
}

/**
 * Hook for touch device detection
 */
export function useTouchDevice(): boolean {
  const { isTouchDevice } = useViewport();
  return isTouchDevice;
}