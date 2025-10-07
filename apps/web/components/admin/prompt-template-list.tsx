"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { useAllPrompts } from '@/lib/prompts/prompt-template-service';
import { AIPromptTemplate, TEMPLATE_CATEGORIES, CATEGORY_LABELS, AIPrompt } from '@/types/prompt-templates';
import { useAuth } from '@/components/auth/auth-provider';
import { Search, Eye } from 'lucide-react';

interface PromptTemplateListProps {
  onPreview?: (template: AIPromptTemplate) => void;
}

export function PromptTemplateList({ 
  onPreview
}: PromptTemplateListProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  // No longer need expandedPrompts state - all templates show as textareas
  
  const rawPrompts = useAllPrompts(user?.sessionToken, filterCategory === 'all' ? undefined : filterCategory);
  const loading = rawPrompts === undefined;
  const error = rawPrompts === null;

  // Transform ai_prompts data to AIPromptTemplate format for compatibility
  const templates: AIPromptTemplate[] = React.useMemo(() => {
    if (!rawPrompts) return [];
    
    return rawPrompts.map((prompt: AIPrompt): AIPromptTemplate => ({
      ...prompt,
      name: prompt.prompt_name,
      category: (prompt.subsystem as any) || 'general',
      variables: [], // ai_prompts doesn't store structured variables like the old system
      version: parseFloat(prompt.prompt_version?.replace('v', '') || '1.0') || 1.0,
      updated_at: prompt.created_at, // Use created_at as updated_at since we don't track updates yet
    }));
  }, [rawPrompts]);

  // Filter templates based on search and category
  const filteredTemplates = React.useMemo(() => {
    if (!templates) return [];
    
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (template.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, filterCategory]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Failed to load prompt templates. Please check your permissions or try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };


  return (
    <div className="space-y-6">

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search templates by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TEMPLATE_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredTemplates.length} of {templates?.length || 0} templates
      </div>

      {/* Template List */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                {searchTerm || filterCategory !== 'all' 
                  ? 'No templates match your search criteria.'
                  : 'No prompt templates found. Create your first template to get started.'
                }
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map(template => (
            <Card key={template._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(template.is_active !== false)}
                      >
                        {template.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Version: {template.prompt_version}</span>
                      <span>Model: {template.ai_model || 'Not specified'}</span>
                      <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onPreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPreview(template)}
                        className="flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Preview
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Template Content - Always Visible Textarea */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Template Content:</div>
                  <textarea
                    value={template.prompt_template}
                    readOnly
                    className="w-full h-64 text-sm font-mono bg-white border rounded p-3 resize-y"
                    style={{ fontFamily: 'Monaco, Consolas, "Lucida Console", monospace' }}
                  />
                </div>
                
                {/* Template Metadata */}
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Template Details:</div>
                  <div className="flex flex-wrap gap-2">
                    {template.workflow_step && (
                      <Badge variant="outline" className="text-xs">
                        Step: {template.workflow_step}
                      </Badge>
                    )}
                    {template.subsystem && (
                      <Badge variant="outline" className="text-xs">
                        System: {template.subsystem}
                      </Badge>
                    )}
                    {template.max_tokens && (
                      <Badge variant="outline" className="text-xs">
                        Max Tokens: {template.max_tokens}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}