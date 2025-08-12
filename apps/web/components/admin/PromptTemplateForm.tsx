"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Textarea } from '@starter/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { Badge } from '@starter/ui/badge';
import { Separator } from '@starter/ui/separator';
import { 
  useCreatePromptTemplate, 
  useUpdatePromptTemplate,
  useValidateTemplate 
} from '@/lib/prompts/prompt-template-service';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  AIPromptTemplate, 
  CreatePromptTemplateForm, 
  PromptVariable,
  TEMPLATE_CATEGORIES,
  CATEGORY_LABELS,
  VARIABLE_TYPES,
  VARIABLE_TYPE_LABELS
} from '@/types/prompt-templates';
import { Plus, Trash2, AlertCircle, CheckCircle, Save, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@starter/ui/alert';

interface PromptTemplateFormProps {
  template?: AIPromptTemplate;
  onSave?: (template: AIPromptTemplate) => void;
  onCancel?: () => void;
  onPreview?: (formData: CreatePromptTemplateForm) => void;
}

export function PromptTemplateForm({ 
  template, 
  onSave, 
  onCancel, 
  onPreview 
}: PromptTemplateFormProps) {
  const { user } = useAuth();
  const createTemplate = useCreatePromptTemplate();
  const updateTemplate = useUpdatePromptTemplate();
  
  const [formData, setFormData] = useState<CreatePromptTemplateForm>({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'general',
    prompt_template: template?.prompt_template || '',
    variables: template?.variables || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  // Early return if not authenticated
  if (!user?.sessionToken) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Authentication required to manage prompt templates.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Real-time validation
  const validation = useValidateTemplate(
    user?.sessionToken || '',
    formData.prompt_template,
    formData.variables
  );

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        prompt_template: template.prompt_template,
        variables: template.variables
      });
    }
  }, [template]);

  const handleInputChange = (field: keyof CreatePromptTemplateForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleVariableChange = (index: number, field: keyof PromptVariable, value: any) => {
    const newVariables = [...formData.variables];
    newVariables[index] = {
      ...newVariables[index],
      [field]: value
    };
    handleInputChange('variables', newVariables);
  };

  const addVariable = () => {
    const newVariable: PromptVariable = {
      name: '',
      description: '',
      type: 'string',
      required: true
    };
    handleInputChange('variables', [...formData.variables, newVariable]);
  };

  const removeVariable = (index: number) => {
    const newVariables = formData.variables.filter((_, i) => i !== index);
    handleInputChange('variables', newVariables);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(formData.name)) {
      newErrors.name = 'Template name must start with a letter and contain only letters, numbers, hyphens, and underscores';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.prompt_template.trim()) {
      newErrors.prompt_template = 'Prompt template content is required';
    }

    // Validate variables
    formData.variables.forEach((variable, index) => {
      if (!variable.name.trim()) {
        newErrors[`variable_${index}_name`] = 'Variable name is required';
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable.name)) {
        newErrors[`variable_${index}_name`] = 'Invalid variable name format';
      }
      
      if (!variable.description.trim()) {
        newErrors[`variable_${index}_description`] = 'Variable description is required';
      }
    });

    // Check for duplicate variable names
    const variableNames = formData.variables.map(v => v.name.toLowerCase());
    const duplicates = variableNames.filter((name, index) => 
      name && variableNames.indexOf(name) !== index
    );
    
    if (duplicates.length > 0) {
      newErrors.variables = `Duplicate variable names found: ${duplicates.join(', ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (template && user?.sessionToken) {
        // Update existing template
        const result = await updateTemplate({
          sessionToken: user.sessionToken,
          template_id: template._id,
          prompt_template: formData.prompt_template,
          variables: formData.variables,
          description: formData.description
        });
        
        if (onSave) {
          onSave({ ...template, ...formData });
        }
      } else if (user?.sessionToken) {
        // Create new template
        const result = await createTemplate({
          sessionToken: user.sessionToken,
          ...formData
        });
        
        if (onSave && result?.templateId) {
          onSave({ 
            _id: result.templateId,
            ...formData,
            version: 1,
            is_active: true,
            created_at: Date.now(),
            updated_at: Date.now()
          } as AIPromptTemplate);
        }
      }
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save template'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(formData);
    }
  };

  const isEditing = !!template;
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'general',
    prompt_template: template?.prompt_template || '',
    variables: template?.variables || []
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Prompt Template' : 'Create New Prompt Template'}
          </h2>
          <p className="text-gray-600">
            {isEditing ? 'Modify the prompt template settings' : 'Define a new AI prompt template'}
          </p>
        </div>
        
        {hasUnsavedChanges && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            Unsaved Changes
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Name */}
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., generate_clarification_questions"
              className={errors.name ? 'border-red-300' : ''}
              disabled={isEditing} // Names can't be changed after creation
            />
            {errors.name && (
              <div className="text-sm text-red-600 mt-1">{errors.name}</div>
            )}
            {isEditing && (
              <div className="text-sm text-gray-500 mt-1">
                Template name cannot be changed after creation
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this template does and when to use it"
              className={errors.description ? 'border-red-300' : ''}
            />
            {errors.description && (
              <div className="text-sm text-red-600 mt-1">{errors.description}</div>
            )}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value: any) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Variables Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Variables ({formData.variables.length})</CardTitle>
            <Button onClick={addVariable} size="sm" className="flex items-center gap-1">
              <Plus size={16} />
              Add Variable
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.variables.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No variables defined. Click &ldquo;Add Variable&rdquo; to create placeholders for dynamic content.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.variables.map((variable, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Variable {index + 1}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVariable(index)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`var_name_${index}`}>Variable Name *</Label>
                      <Input
                        id={`var_name_${index}`}
                        value={variable.name}
                        onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                        placeholder="e.g., participant_name"
                        className={errors[`variable_${index}_name`] ? 'border-red-300' : ''}
                      />
                      {errors[`variable_${index}_name`] && (
                        <div className="text-sm text-red-600 mt-1">
                          {errors[`variable_${index}_name`]}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor={`var_type_${index}`}>Type</Label>
                      <Select
                        value={variable.type}
                        onValueChange={(value: any) => handleVariableChange(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VARIABLE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {VARIABLE_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`var_desc_${index}`}>Description *</Label>
                    <Input
                      id={`var_desc_${index}`}
                      value={variable.description}
                      onChange={(e) => handleVariableChange(index, 'description', e.target.value)}
                      placeholder="Describe what this variable represents"
                      className={errors[`variable_${index}_description`] ? 'border-red-300' : ''}
                    />
                    {errors[`variable_${index}_description`] && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors[`variable_${index}_description`]}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`var_default_${index}`}>Default Value</Label>
                      <Input
                        id={`var_default_${index}`}
                        value={variable.default_value || ''}
                        onChange={(e) => handleVariableChange(index, 'default_value', e.target.value || undefined)}
                        placeholder="Optional default value"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-8">
                      <input
                        type="checkbox"
                        id={`var_required_${index}`}
                        checked={variable.required}
                        onChange={(e) => handleVariableChange(index, 'required', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`var_required_${index}`}>Required</Label>
                    </div>
                  </div>
                </div>
              ))}
              
              {errors.variables && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.variables}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prompt Template Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Prompt Template Content</CardTitle>
            {validation && (
              <div className="flex items-center gap-2">
                {validation.isValid ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={16} />
                    <span className="text-sm">Valid</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle size={16} />
                    <span className="text-sm">Issues Found</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prompt_template">Template Content *</Label>
            <Textarea
              id="prompt_template"
              value={formData.prompt_template}
              onChange={(e) => handleInputChange('prompt_template', e.target.value)}
              placeholder="Enter your prompt template using {{variable_name}} for placeholders"
              className={`min-h-32 font-mono ${errors.prompt_template ? 'border-red-300' : ''}`}
            />
            {errors.prompt_template && (
              <div className="text-sm text-red-600 mt-1">{errors.prompt_template}</div>
            )}
            <div className="text-sm text-gray-500 mt-1">
              Use double curly braces for variables: {`{{variable_name}}`}
            </div>
          </div>

          {/* Template Validation Results */}
          {validation && !validation.isValid && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Template Validation Issues:</div>
                  {validation.syntaxErrors.map((error: string, index: number) => (
                    <div key={index} className="text-sm">• {error}</div>
                  ))}
                  {validation.templateErrors.map((error: string, index: number) => (
                    <div key={index} className="text-sm">• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Extracted Variables */}
          {validation?.extractedVariables && validation.extractedVariables.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Variables found in template:
              </div>
              <div className="flex flex-wrap gap-2">
                {validation.extractedVariables.map(varName => (
                  <Badge key={varName} variant="outline" className="text-blue-600 border-blue-200">
                    {`{{${varName}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          {onPreview && (
            <Button variant="outline" onClick={handlePreview} className="flex items-center gap-2">
              <Eye size={16} />
              Preview
            </Button>
          )}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || (validation && !validation.isValid)}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
        </Button>
      </div>

      {/* Save Errors */}
      {errors.submit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}