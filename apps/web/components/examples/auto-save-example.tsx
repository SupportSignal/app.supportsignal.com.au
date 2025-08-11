'use client';

/**
 * Example component demonstrating how to use the reusable useAutoSave hook
 * 
 * This shows how any wizard step or form can easily add auto-save functionality
 * with consistent behavior and visual feedback.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@starter/ui/card';
import { Label } from '@starter/ui/label';
import { Input } from '@starter/ui/input';
import { Button } from '@starter/ui/button';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';
import { useAutoSave } from '@/hooks/useAutoSave';

interface ExampleFormData {
  title: string;
  description: string;
  notes: string;
}

export function AutoSaveExample() {
  const [formData, setFormData] = useState<ExampleFormData>({
    title: '',
    description: '',
    notes: '',
  });

  // Example save function - replace with your actual API call
  const saveForm = async (data: ExampleFormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Network error');
    }
    
    console.log('Form saved:', data);
  };

  // Use the reusable auto-save hook
  const { autoSaveState, triggerSave } = useAutoSave(
    formData,
    saveForm,
    {
      debounceMs: 2000, // 2 second delay
      enabled: true,
      onSuccess: () => console.log('✅ Auto-save successful'),
      onError: (error) => console.error('❌ Auto-save failed:', error),
    }
  );

  const handleFieldChange = (field: keyof ExampleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Auto-Save Example Form</span>
          {/* Status bar approach - integrated into header */}
          <AutoSaveIndicator 
            autoSaveState={autoSaveState} 
            variant="status-bar" 
          />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Enter title..."
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Enter description..."
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Enter notes..."
            className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Alternative: Badge approach for inline status */}
        <div className="flex justify-between items-center">
          <AutoSaveIndicator 
            autoSaveState={autoSaveState} 
            variant="badge" 
          />
          
          <Button 
            onClick={() => triggerSave()}
            disabled={autoSaveState.isSaving}
          >
            {autoSaveState.isSaving ? 'Saving...' : 'Manual Save'}
          </Button>
        </div>

        {/* Debug info */}
        <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
          <strong>Debug Info:</strong><br />
          Has unsaved changes: {autoSaveState.hasUnsavedChanges.toString()}<br />
          Is saving: {autoSaveState.isSaving.toString()}<br />
          Last save: {autoSaveState.lastSaveTime?.toLocaleTimeString() || 'Never'}<br />
          Error: {autoSaveState.error || 'None'}
        </div>
      </CardContent>
    </Card>
  );
}