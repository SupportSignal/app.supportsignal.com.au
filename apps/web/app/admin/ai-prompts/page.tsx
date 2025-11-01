/**
 * Story 11.0: AI Prompts Admin Page
 *
 * Enhanced with group-based organization, tabs for Generation vs Analysis,
 * and integrated template library for quick prompt creation.
 */

"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { PromptTemplateList } from '@/components/admin/prompt-template-list';
import { TemplateSeederInterface } from '@/components/admin/template-seeder-interface';
import { PromptGroupManager } from '@/components/admin/prompts/PromptGroupManager';
import { TemplateLibrary } from '@/components/admin/prompts/TemplateLibrary';
import { AIPromptTemplate } from '@/types/prompt-templates';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@starter/ui/tabs';
import { ArrowLeft, Settings, Plus } from 'lucide-react';
import { hasDeveloperAccess } from '@/lib/utils/developerAccess';

type ViewMode = 'groups' | 'templates' | 'seeder' | 'legacy-list';
type PromptCategory = 'generation' | 'analysis';

export default function AIPromptsAdminPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [activeCategory, setActiveCategory] = useState<PromptCategory>('generation');

  // Debug logging
  console.log('🔍 AIPromptsAdminPage - User:', user);
  console.log('🔍 AIPromptsAdminPage - hasDeveloperAccess:', hasDeveloperAccess(user));

  // Access control - developer access required
  if (!user || !hasDeveloperAccess(user)) {
    console.log('❌ AIPromptsAdminPage - Access denied', { user, hasAccess: hasDeveloperAccess(user) });
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Developer access required to manage AI prompt templates.
          </p>
        </div>
      </div>
    );
  }

  console.log('✅ AIPromptsAdminPage - Access granted, rendering PromptGroupManager');

  const handlePreview = (template: AIPromptTemplate) => {
    // TODO: Implement preview functionality
    alert(`Preview functionality not yet implemented for: ${template.name}`);
  };

  const handleOpenSeeder = () => {
    setViewMode('seeder');
  };

  const handleSeedingComplete = () => {
    setViewMode('groups');
  };

  const handleUseTemplate = (template: any) => {
    // TODO: Story 11.1 - Implement prompt creation from template
    alert(`Create prompt from template: ${template.name}\n\nThis will be implemented in Story 11.1`);
  };

  const handleCreateGroup = () => {
    // TODO: Story 11.1 - Implement group creation dialog
    alert('Group creation dialog will be implemented in Story 11.1');
  };

  const handleEditGroup = (groupId: string) => {
    // TODO: Story 11.1 - Implement group editing dialog
    alert(`Edit group: ${groupId}\n\nThis will be implemented in Story 11.1`);
  };

  const handleDeleteGroup = (groupId: string) => {
    // TODO: Story 11.1 - Implement group deletion confirmation
    alert(`Delete group: ${groupId}\n\nThis will be implemented in Story 11.1`);
  };

  return (
    <div className="space-y-6">
      {/* Version Banner - Red indicator to verify deployment changes */}
      <div className="bg-red-600 text-white px-4 py-2 rounded text-sm font-mono flex items-center justify-between">
        <div>
          <strong>BUILD:</strong> 2025-11-01T04:50:00Z |
          <strong className="ml-2">DEPLOY:</strong> v11.0.debug.5-API-CHECK
        </div>
        <div className="text-xs opacity-75">
          Checking if api.promptGroups.listGroups exists in generated API
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Prompt Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Organize, test, and manage AI prompts with group-based workflows
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {viewMode !== 'groups' && (
            <Button
              variant="outline"
              onClick={() => setViewMode('groups')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Groups
            </Button>
          )}

          {viewMode === 'groups' && (
            <>
              <Button
                variant="outline"
                onClick={() => setViewMode('templates')}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Template Library
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenSeeder}
                className="flex items-center gap-2"
              >
                <Settings size={16} />
                System Templates
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-96">
        {/* Groups View - New Default */}
        {viewMode === 'groups' && (
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as PromptCategory)}>
            <TabsList className="mb-4">
              <TabsTrigger value="generation">Generation Prompts</TabsTrigger>
              <TabsTrigger value="analysis">Analysis Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="generation" className="space-y-4">
              <PromptGroupManager
                onCreateGroup={handleCreateGroup}
                onEditGroup={handleEditGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Analysis prompts will be organized in Story 11.2
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This tab prepares the UI for batch analysis workflows
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Template Library View */}
        {viewMode === 'templates' && (
          <TemplateLibrary onUseTemplate={handleUseTemplate} />
        )}

        {/* Legacy List View - Preserved for backward compatibility */}
        {viewMode === 'legacy-list' && (
          <PromptTemplateList onPreview={handlePreview} />
        )}

        {/* System Template Seeder */}
        {viewMode === 'seeder' && (
          <div className="space-y-6">
            <TemplateSeederInterface onSeedingComplete={handleSeedingComplete} />

            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => setViewMode('groups')}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Groups
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Help Information */}
      {viewMode === 'groups' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prompt Organization Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">1.</span>
              <div>
                <strong>Group-Based Organization:</strong> Prompts are organized into collapsible groups for better workflow management. Drag-and-drop to reorder prompts within groups.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">2.</span>
              <div>
                <strong>Template Library:</strong> Click &ldquo;Template Library&rdquo; to access starter templates for common prompt patterns (predicate, classification, observation).
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">3.</span>
              <div>
                <strong>Cost Indicators:</strong> All prompts show estimated execution costs based on the selected AI model. Use this to optimize your prompt choices.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">4.</span>
              <div>
                <strong>First Time Setup:</strong> Click &ldquo;System Templates&rdquo; to seed the database with default incident processing prompts if needed.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}