"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { useSystemPromptTemplates } from '@/lib/prompts/prompt-template-service';
import { AIPromptTemplate, TEMPLATE_CATEGORIES, CATEGORY_LABELS } from '@/types/prompt-templates';
import { useAuth } from '@/components/auth/auth-provider';
import { Search, Plus, Edit, Trash2, Eye, Play } from 'lucide-react';

interface PromptTemplateListProps {
  onEdit?: (template: AIPromptTemplate) => void;
  onPreview?: (template: AIPromptTemplate) => void;
  onTest?: (template: AIPromptTemplate) => void;
  onDelete?: (template: AIPromptTemplate) => void;
  onCreate?: () => void;
}

export function PromptTemplateList({ 
  onEdit, 
  onPreview, 
  onTest, 
  onDelete, 
  onCreate 
}: PromptTemplateListProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const templates = useSystemPromptTemplates(user?.sessionToken, filterCategory === 'all' ? undefined : filterCategory);
  const loading = templates === undefined;
  const error = templates === null;

  // Filter templates based on search and category
  const filteredTemplates = React.useMemo(() => {
    if (!templates) return [];
    
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase());
      
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
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Prompt Templates</h2>
          <p className="text-gray-600">Manage system prompt templates for AI operations</p>
        </div>
        
        {onCreate && (
          <Button onClick={onCreate} className="flex items-center gap-2">
            <Plus size={16} />
            Create Template
          </Button>
        )}
      </div>

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
                        className={getStatusColor(template.is_active)}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Version: {template.version}</span>
                      <span>Variables: {template.variables.length}</span>
                      <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
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
                    
                    {onTest && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTest(template)}
                        className="flex items-center gap-1"
                      >
                        <Play size={14} />
                        Test
                      </Button>
                    )}
                    
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(template)}
                        className="flex items-center gap-1"
                      >
                        <Edit size={14} />
                        Edit
                      </Button>
                    )}
                    
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(template)}
                        className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Template Preview */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-700 mb-1">Template Preview:</div>
                  <div className="text-sm text-gray-600 font-mono">
                    {template.prompt_template.length > 200 
                      ? `${template.prompt_template.substring(0, 200)}...` 
                      : template.prompt_template
                    }
                  </div>
                </div>
                
                {/* Variables Summary */}
                {template.variables.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">Variables ({template.variables.length}):</div>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map(variable => (
                        <Badge key={variable.name} variant="outline" className="text-xs">
                          {variable.name}
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}