"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { PromptTemplateList } from '@/components/admin/PromptTemplateList';
import { PromptTemplateForm } from '@/components/admin/PromptTemplateForm';
import { TemplateSeederInterface } from '@/components/admin/TemplateSeederInterface';
import { AIPromptTemplate, CreatePromptTemplateForm } from '@/types/prompt-templates';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { ArrowLeft, Plus, Settings } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'seeder';

export default function AIPromptsAdminPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<AIPromptTemplate | undefined>();

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

  const handleCreate = () => {
    setSelectedTemplate(undefined);
    setViewMode('create');
  };

  const handleEdit = (template: AIPromptTemplate) => {
    setSelectedTemplate(template);
    setViewMode('edit');
  };

  const handleSave = (template: AIPromptTemplate) => {
    // Template saved successfully, return to list
    setViewMode('list');
    setSelectedTemplate(undefined);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedTemplate(undefined);
  };

  const handlePreview = (template: AIPromptTemplate | CreatePromptTemplateForm) => {
    // TODO: Implement preview functionality
    alert(`Preview functionality not yet implemented for: ${template.name}`);
  };

  const handleTest = (template: AIPromptTemplate) => {
    // TODO: Implement test functionality
    alert(`Test functionality not yet implemented for: ${template.name}`);
  };

  const handleDelete = (template: AIPromptTemplate) => {
    // TODO: Implement delete functionality
    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      alert('Delete functionality not yet implemented');
    }
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
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to List
            </Button>
          )}
          
          {viewMode === 'list' && (
            <>
              <Button
                variant="outline"
                onClick={handleOpenSeeder}
                className="flex items-center gap-2"
              >
                <Settings size={16} />
                System Setup
              </Button>
              
              <Button
                onClick={handleCreate}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Create Template
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-96">
        {viewMode === 'list' && (
          <PromptTemplateList
            onEdit={handleEdit}
            onPreview={handlePreview}
            onTest={handleTest}
            onDelete={handleDelete}
            onCreate={handleCreate}
          />
        )}

        {(viewMode === 'create' || viewMode === 'edit') && (
          <PromptTemplateForm
            template={selectedTemplate}
            onSave={handleSave}
            onCancel={handleCancel}
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
                <strong>First Time Setup:</strong> Click &ldquo;System Setup&rdquo; to seed the system with default AI prompt templates for incident processing.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">2.</span>
              <div>
                <strong>Template Management:</strong> Create, edit, and organize prompt templates by category (Clarification Questions, Narrative Enhancement, General).
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">3.</span>
              <div>
                <strong>Variable System:</strong> Use &ldquo;{`{{variable_name}}`}&rdquo; syntax in templates for dynamic content substitution during AI processing.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}