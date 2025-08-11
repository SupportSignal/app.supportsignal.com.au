'use client';

import { AutoSaveState } from '@/hooks/useAutoSave';
import { AlertCircle } from 'lucide-react';

export interface AutoSaveIndicatorProps {
  autoSaveState: AutoSaveState;
  /** Display variant */
  variant?: 'inline' | 'status-bar' | 'badge';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the checkmark for saved state (default: true) */
  showCheckmark?: boolean;
}

/**
 * Reusable auto-save status indicator component
 * 
 * Provides consistent visual feedback for auto-save operations across the app.
 * Supports different display variants for various UI contexts.
 */
export function AutoSaveIndicator({ 
  autoSaveState, 
  variant = 'inline',
  className = '',
  showCheckmark = true
}: AutoSaveIndicatorProps) {
  const { isSaving, lastSaveTime, error } = autoSaveState;

  // Don't render anything if no status to show
  if (!isSaving && !lastSaveTime && !error) {
    return null;
  }

  const getContent = () => {
    if (error) {
      return (
        <span className="text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Save failed
        </span>
      );
    }

    if (isSaving) {
      return (
        <span className="text-blue-600 flex items-center gap-1">
          <span className="animate-pulse">Saving...</span>
        </span>
      );
    }

    if (lastSaveTime && showCheckmark) {
      return (
        <span className="text-green-600 flex items-center gap-1">
          ✓ Saved {lastSaveTime.toLocaleTimeString()}
        </span>
      );
    }

    return null;
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'status-bar':
        return 'text-sm flex items-center gap-1';
      case 'badge':
        return 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border';
      case 'inline':
      default:
        return 'text-sm flex items-center gap-1';
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {content}
    </div>
  );
}