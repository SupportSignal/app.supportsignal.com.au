'use client';

import React, { useState } from 'react';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';
import { useAutoSave } from '@/hooks/useAutoSave';

/**
 * Interactive demo component showing the auto-save system in action
 * This allows users to see the saving → saved state transitions
 */
export function AutoSaveDemo() {
  const [demoData, setDemoData] = useState({
    title: '',
    description: '',
  });

  // Mock save function that simulates API call
  const mockSave = async (data: typeof demoData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate occasional failures for testing error states
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error');
    }
    
    console.log('Demo data saved:', data);
  };

  const { autoSaveState, triggerSave } = useAutoSave(
    demoData,
    mockSave,
    {
      debounceMs: 2000, // 2 seconds for demo
      enabled: true,
      onSuccess: () => console.log('✅ Demo auto-save successful'),
      onError: (error) => console.error('❌ Demo auto-save failed:', error),
    }
  );

  const handleChange = (field: keyof typeof demoData, value: string) => {
    setDemoData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Auto-save status display */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Try typing to see auto-save in action:</h4>
        <AutoSaveIndicator 
          autoSaveState={autoSaveState} 
          variant="status-bar" 
        />
      </div>

      {/* Form fields */}
      <div className="space-y-3">
        <div>
          <Input
            placeholder="Type a title here..."
            value={demoData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full"
          />
        </div>
        
        <div>
          <Input
            placeholder="Type a description here..."
            value={demoData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Manual save button */}
      <div className="flex items-center justify-between">
        <AutoSaveIndicator 
          autoSaveState={autoSaveState} 
          variant="inline" 
        />
        
        <Button 
          onClick={() => triggerSave()}
          disabled={autoSaveState.isSaving}
          size="sm"
          variant="outline"
        >
          {autoSaveState.isSaving ? 'Saving...' : 'Manual Save'}
        </Button>
      </div>

      {/* Debug info for showcase */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
        <strong>Debug Info:</strong><br />
        Has unsaved changes: {autoSaveState.hasUnsavedChanges.toString()}<br />
        Is saving: {autoSaveState.isSaving.toString()}<br />
        Last save: {autoSaveState.lastSaveTime?.toLocaleTimeString() || 'Never'}<br />
        Error: {autoSaveState.error || 'None'}
      </div>
    </div>
  );
}