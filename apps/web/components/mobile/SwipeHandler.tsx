/**
 * SwipeHandler component for touch gesture detection
 * Story 3.5: Mobile-First Responsive Incident Capture
 */

import React, { useRef, useCallback, TouchEvent } from 'react';

export interface SwipeHandlerProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for a swipe
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
}

export function SwipeHandler({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  children,
  className,
  disabled = false
}: SwipeHandlerProps) {
  const touchData = useRef<TouchData | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    touchData.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now()
    };
  }, [disabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (disabled || !touchData.current) return;

    const touch = e.changedTouches[0];
    const { startX, startY, startTime } = touchData.current;
    
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const deltaTime = Date.now() - startTime;
    
    // Reset touch data
    touchData.current = null;
    
    // Only process quick swipes (< 300ms) to avoid conflicts with scrolling
    if (deltaTime > 300) return;
    
    // Determine primary direction
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Horizontal swipe
    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    // Vertical swipe
    else if (absDeltaY > threshold) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
  }, [disabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handleTouchCancel = useCallback(() => {
    touchData.current = null;
  }, []);

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{ touchAction: 'pan-y' }} // Allow vertical scrolling but capture horizontal swipes
    >
      {children}
    </div>
  );
}