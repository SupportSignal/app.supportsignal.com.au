'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoSaveState {
  isSaving: boolean;
  lastSaveTime: Date | null;
  error: string | null;
  hasUnsavedChanges: boolean;
}

export interface AutoSaveOptions {
  /** Debounce delay in milliseconds (default: 3000) */
  debounceMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Whether to auto-save on mount if data exists (default: false) */
  saveOnMount?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom success handler */
  onSuccess?: () => void;
}

/**
 * Reusable auto-save hook for forms and text areas
 * 
 * Provides consistent auto-save behavior across the application with:
 * - Debounced saving to prevent excessive API calls
 * - Loading/success/error states
 * - Cleanup on unmount
 * - Flexible save function support
 * 
 * @example
 * ```tsx
 * const { autoSaveState, triggerSave } = useAutoSave(
 *   formData,
 *   async (data) => {
 *     await updateNarrative({
 *       sessionToken,
 *       incident_id: incidentId,
 *       ...data
 *     });
 *   },
 *   { debounceMs: 2000 }
 * );
 * 
 * // In your component:
 * {autoSaveState.isSaving && <span>Saving...</span>}
 * {autoSaveState.lastSaveTime && <span>✓ Saved {autoSaveState.lastSaveTime.toLocaleTimeString()}</span>}
 * ```
 */
export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options: AutoSaveOptions = {}
) {
  const {
    debounceMs = 3000,
    enabled = true,
    saveOnMount = false,
    onError,
    onSuccess
  } = options;

  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaveTime: null,
    error: null,
    hasUnsavedChanges: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(data);
  const mountedRef = useRef(false);

  // Clear any pending timeout
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Perform the actual save operation
  const performSave = useCallback(async (dataToSave: T) => {
    if (!enabled) return;

    setAutoSaveState(prev => ({
      ...prev,
      isSaving: true,
      error: null,
    }));

    try {
      await saveFn(dataToSave);
      
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaveTime: new Date(),
        hasUnsavedChanges: false,
        error: null,
      }));

      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false, // Reset to prevent stuck "Saving..." state
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      console.warn('Auto-save failed:', error);
    }
  }, [enabled, saveFn, onSuccess, onError]);

  // Trigger auto-save with debounce
  const triggerAutoSave = useCallback((dataToSave: T) => {
    if (!enabled) return;

    // Clear any existing timeout
    clearPendingTimeout();

    // Set has changes immediately
    setAutoSaveState(prev => ({
      ...prev,
      hasUnsavedChanges: true,
      error: null, // Clear previous errors
    }));

    // Schedule the save
    timeoutRef.current = setTimeout(() => {
      performSave(dataToSave);
    }, debounceMs);
  }, [enabled, debounceMs, clearPendingTimeout, performSave]);

  // Manual save function (for immediate saves without debounce)
  const triggerSave = useCallback(async (dataToSave?: T) => {
    clearPendingTimeout();
    await performSave(dataToSave || data);
  }, [clearPendingTimeout, performSave, data]);

  // Monitor data changes and trigger auto-save
  useEffect(() => {
    // Skip on first mount unless saveOnMount is true
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (saveOnMount && enabled) {
        triggerAutoSave(data);
      }
      previousDataRef.current = data;
      return;
    }

    // Check if data actually changed (deep comparison for objects)
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (dataChanged && enabled) {
      triggerAutoSave(data);
    }

    previousDataRef.current = data;
  }, [data, enabled, saveOnMount, triggerAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  return {
    autoSaveState,
    triggerSave,
    clearError: useCallback(() => {
      setAutoSaveState(prev => ({ ...prev, error: null }));
    }, []),
  };
}