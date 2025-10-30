/**
 * Story 11.0: Template Library Component
 *
 * Provides starter prompt templates that users can customize.
 * Helps users get started quickly with common prompt patterns.
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { FileText, Sparkles } from 'lucide-react';

interface PromptTemplate {
  id: string;
  name: string;
  category: 'predicate' | 'classification' | 'observation';
  description: string;
  useCase: string;
  template: string;
  variables: string[];
  recommendedModel: string;
}

interface TemplateLibraryProps {
  onUseTemplate?: (template: PromptTemplate) => void;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'predicate-yes-no',
    name: 'Yes/No Decision',
    category: 'predicate',
    description: 'Binary decision based on context',
    useCase: 'Determining if an incident meets specific criteria (e.g., "Is this a critical safety incident?")',
    template: 'Answer with Yes or No based on the following context:\n\n{{context}}\n\nQuestion: {{question}}',
    variables: ['context', 'question'],
    recommendedModel: 'openai/gpt-4o-mini',
  },
  {
    id: 'classification-categories',
    name: 'Category Classification',
    category: 'classification',
    description: 'Classify input into predefined categories',
    useCase: 'Categorizing incidents by type (e.g., "Physical Injury", "Property Damage", "Near Miss")',
    template: 'Classify the following input into one of these categories: {{categories}}\n\nInput: {{input}}\n\nProvide only the category name.',
    variables: ['categories', 'input'],
    recommendedModel: 'openai/gpt-4o-mini',
  },
  {
    id: 'observation-insight',
    name: 'Brief Observation',
    category: 'observation',
    description: 'Provide concise insight about data',
    useCase: 'Generating brief insights from incident data (e.g., identifying patterns, suggesting improvements)',
    template: 'Provide a brief, actionable insight about the following data:\n\n{{data}}\n\nFocus on: {{focus_area}}',
    variables: ['data', 'focus_area'],
    recommendedModel: 'openai/gpt-5',
  },
];

const CATEGORY_INFO = {
  predicate: {
    label: 'Predicate',
    description: 'True/False decision making',
    color: 'blue',
  },
  classification: {
    label: 'Classification',
    description: 'Categorize into groups',
    color: 'purple',
  },
  observation: {
    label: 'Observation',
    description: 'Generate insights',
    color: 'green',
  },
} as const;

export function TemplateLibrary({ onUseTemplate }: TemplateLibraryProps) {
  function handleUseTemplate(template: PromptTemplate) {
    if (onUseTemplate) {
      onUseTemplate(template);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prompt Templates</h2>
          <p className="text-muted-foreground mt-1">
            Start with proven patterns for common use cases
          </p>
        </div>
        <Sparkles className="h-8 w-8 text-yellow-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PROMPT_TEMPLATES.map((template) => {
          const categoryInfo = CATEGORY_INFO[template.category];

          return (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {categoryInfo.label}
                  </Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Use Case</h4>
                  <p className="text-sm text-muted-foreground">{template.useCase}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">Variables</h4>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="text-xs font-mono">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">Recommended Model</h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    {template.recommendedModel}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Template Preview</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                    {template.template}
                  </pre>
                </div>

                <Button
                  onClick={() => handleUseTemplate(template)}
                  className="w-full"
                  variant="default"
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Template Categories</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <div key={key} className="flex items-start gap-2">
              <div className="mt-1">
                <div className={`h-2 w-2 rounded-full bg-${info.color}-500`} />
              </div>
              <div>
                <p className="font-medium text-sm">{info.label}</p>
                <p className="text-xs text-muted-foreground">{info.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
