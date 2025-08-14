"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { PromptTemplateList } from '@/components/admin/PromptTemplateList';
import { TemplateSeederInterface } from '@/components/admin/TemplateSeederInterface';
import { AIPromptTemplate } from '@/types/prompt-templates';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { ArrowLeft, Settings } from 'lucide-react';

type ViewMode = 'list' | 'seeder';

export default function AIPromptsAdminPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Access control - only system admins
  if (!user || user.role !== 'system_admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            System administrator privileges required to manage AI prompt templates.
          </p>
        </div>
      </div>
    );
  }

  const handlePreview = (template: AIPromptTemplate) => {
    // TODO: Implement preview functionality
    alert(`Preview functionality not yet implemented for: ${template.name}`);
  };

  const handleOpenSeeder = () => {
    setViewMode('seeder');
  };

  const handleSeedingComplete = () => {
    setViewMode('list');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Prompt Templates
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage AI prompt templates for incident processing and analysis
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {viewMode !== 'list' && (
            <Button
              variant="outline"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to List
            </Button>
          )}
          
          {viewMode === 'list' && (
            <Button
              variant="outline"
              onClick={handleOpenSeeder}
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              Template Management
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-96">
        {viewMode === 'list' && (
          <PromptTemplateList
            onPreview={handlePreview}
          />
        )}

        {viewMode === 'seeder' && (
          <div className="space-y-6">
            <TemplateSeederInterface
              onSeedingComplete={handleSeedingComplete}
            />
            
            {/* Back to Templates Button */}
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Templates
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Help Information */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">1.</span>
              <div>
                <strong>First Time Setup:</strong> Click &ldquo;Template Management&rdquo; to seed the system with hardcoded AI prompt templates for incident processing.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">2.</span>
              <div>
                <strong>Template System:</strong> Templates are defined in code and seeded into the database. Templates include clarification questions, narrative enhancement, and mock data generation.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">3.</span>
              <div>
                <strong>Variable Substitution:</strong> Templates use &ldquo;{`{{variable_name}}`}&rdquo; syntax for dynamic content substitution during AI processing.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}