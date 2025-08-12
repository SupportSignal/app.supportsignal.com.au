"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { 
  useSeedDefaultPrompts, 
  useDefaultTemplates 
} from '@/lib/prompts/prompt-template-service';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  DefaultTemplatesInfo, 
  SeedingResult,
  CATEGORY_LABELS 
} from '@/types/prompt-templates';
import { 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Database,
  Zap 
} from 'lucide-react';

interface TemplateSeederInterfaceProps {
  onSeedingComplete?: (result: SeedingResult) => void;
}

export function TemplateSeederInterface({ 
  onSeedingComplete 
}: TemplateSeederInterfaceProps) {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [lastSeedingResult, setLastSeedingResult] = useState<SeedingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const seedDefaultPrompts = useSeedDefaultPrompts();
  const defaultTemplatesInfo = useDefaultTemplates(user?.sessionToken);
  
  const loading = defaultTemplatesInfo === undefined;
  const templatesError = defaultTemplatesInfo === null;

  // Early return if not authenticated
  if (!user?.sessionToken) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Authentication required to seed templates.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleSeedTemplates = async () => {
    setSeeding(true);
    setError(null);
    
    try {
      if (!user?.sessionToken) {
        throw new Error('Authentication required');
      }
      const result = await seedDefaultPrompts({ sessionToken: user.sessionToken });
      setLastSeedingResult(result);
      
      if (onSeedingComplete) {
        onSeedingComplete(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to seed templates';
      setError(errorMessage);
    } finally {
      setSeeding(false);
    }
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getResultColor = (action: string) => {
    if (action === 'created') return 'bg-green-100 text-green-800';
    if (action.includes('skipped')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin mr-2" size={16} />
            Loading template information...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templatesError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load default template information. Please check your permissions or try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const templates = defaultTemplatesInfo as DefaultTemplatesInfo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Default Template Seeder</h2>
          <p className="text-gray-600">Initialize system with default AI prompt templates</p>
        </div>
        
        <Button 
          onClick={handleSeedTemplates}
          disabled={seeding || !templates.validation.isValid}
          className="flex items-center gap-2"
        >
          {seeding ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : (
            <Download size={16} />
          )}
          {seeding ? 'Seeding...' : 'Seed Templates'}
        </Button>
      </div>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Template Validation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Badge className={getStatusColor(templates.validation.isValid)}>
              {templates.validation.isValid ? 'Valid' : 'Issues Found'}
            </Badge>
            <span className="text-sm text-gray-600">
              {templates.totalTemplates} default templates available
            </span>
          </div>

          {!templates.validation.isValid && templates.validation.errors.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Template Validation Errors:</div>
                  {templates.validation.errors.map((error, index) => (
                    <div key={index} className="text-sm">• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Available Default Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Available Default Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.templates.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No default templates available
            </div>
          ) : (
            <div className="space-y-3">
              {templates.templates.map((template, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {template.variableCount} vars
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seeding Result */}
      {lastSeedingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap size={20} />
              Last Seeding Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={16} />
                  <span>Processed: {lastSeedingResult.totalProcessed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">Created: {lastSeedingResult.created}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">Skipped: {lastSeedingResult.skipped}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Template Results:</div>
                {lastSeedingResult.results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{result.name}</span>
                    <Badge className={getResultColor(result.action)}>
                      {result.action}
                    </Badge>
                  </div>
                ))}
              </div>

              {lastSeedingResult.message && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{lastSeedingResult.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Seeding Failed</div>
            <div className="text-sm mt-1">{error}</div>
          </AlertDescription>
        </Alert>
      )}

      {/* Help Information */}
      <Card>
        <CardHeader>
          <CardTitle>How Template Seeding Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-600 mt-0.5" size={16} />
            <div>
              <strong>Safe Operation:</strong> Only creates new templates, never overwrites existing ones
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-600 mt-0.5" size={16} />
            <div>
              <strong>Validation First:</strong> All templates are validated before creation
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-600 mt-0.5" size={16} />
            <div>
              <strong>Template Categories:</strong> Includes clarification questions, narrative enhancement, and general templates
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-600 mt-0.5" size={16} />
            <div>
              <strong>Ready to Use:</strong> Seeded templates are immediately available for AI operations
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}