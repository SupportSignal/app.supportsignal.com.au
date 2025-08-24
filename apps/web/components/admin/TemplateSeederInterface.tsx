"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { 
  useSeedDefaultPrompts, 
  useDefaultTemplates,
  useClearAllTemplates,
  useResetAndSeedPrompts
} from '@/lib/prompts/prompt-template-service';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  DefaultTemplatesInfo, 
  SeedingResult,
  ClearResult,
  ResetAndSeedResult,
  CATEGORY_LABELS 
} from '@/types/prompt-templates';
import { 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Database,
  Zap,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface TemplateSeederInterfaceProps {
  onSeedingComplete?: (result: SeedingResult) => void;
  onClearingComplete?: (result: ClearResult) => void;
  onResetAndSeedComplete?: (result: ResetAndSeedResult) => void;
}

export function TemplateSeederInterface({ 
  onSeedingComplete,
  onClearingComplete,
  onResetAndSeedComplete
}: TemplateSeederInterfaceProps) {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastSeedingResult, setLastSeedingResult] = useState<SeedingResult | null>(null);
  const [lastClearResult, setLastClearResult] = useState<ClearResult | null>(null);
  const [lastResetAndSeedResult, setLastResetAndSeedResult] = useState<ResetAndSeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const seedDefaultPrompts = useSeedDefaultPrompts();
  const clearAllTemplates = useClearAllTemplates();
  const resetAndSeedPrompts = useResetAndSeedPrompts();
  const defaultTemplatesInfo = useDefaultTemplates(user?.sessionToken);
  
  // Get user permissions to check for sample_data access
  const userPermissions = useQuery(
    api.permissions.getUserPermissions,
    user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip'
  );
  
  const hasSampleDataPermission = userPermissions?.permissions?.includes('sample_data') || false;
  
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

  const handleClearTemplates = async () => {
    if (!window.confirm('⚠️ DANGER: This will deactivate ALL prompt templates in the database. This action cannot be undone. Are you sure you want to continue?')) {
      return;
    }
    
    if (!window.confirm('⚠️ FINAL WARNING: You are about to permanently deactivate all AI prompt templates. Type "DEACTIVATE" in the next dialog to confirm.')) {
      return;
    }
    
    const userInput = window.prompt('Type "DEACTIVATE" to confirm deactivating all templates:');
    if (userInput !== 'DEACTIVATE') {
      alert('Deactivation cancelled. You must type "DEACTIVATE" exactly to confirm.');
      return;
    }
    
    setClearing(true);
    setError(null);
    
    try {
      if (!user?.sessionToken) {
        throw new Error('Authentication required');
      }
      const result = await clearAllTemplates({ sessionToken: user.sessionToken });
      setLastClearResult(result);
      
      if (onClearingComplete) {
        onClearingComplete(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear templates';
      setError(errorMessage);
    } finally {
      setClearing(false);
    }
  };

  const handleResetAndSeed = async () => {
    setResetting(true);
    setError(null);
    
    try {
      if (!user?.sessionToken) {
        throw new Error('Authentication required');
      }
      const result = await resetAndSeedPrompts({ sessionToken: user.sessionToken });
      setLastResetAndSeedResult(result);
      
      if (onResetAndSeedComplete) {
        onResetAndSeedComplete(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset and seed templates';
      setError(errorMessage);
    } finally {
      setResetting(false);
    }
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
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
          <h2 className="text-2xl font-bold text-gray-900">System Prompt Manager</h2>
          <p className="text-gray-600">Seed system with AI prompt templates and manage prompt database</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSeedTemplates}
            disabled={seeding || clearing || resetting || !templates.validation.isValid}
            className="flex items-center gap-2"
          >
            {seeding ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            {seeding ? 'Seeding...' : 'Seed Templates'}
          </Button>

          {hasSampleDataPermission && (
            <Button 
              onClick={handleResetAndSeed}
              disabled={seeding || clearing || resetting}
              variant="default"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {resetting ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <RotateCcw size={16} />
              )}
              {resetting ? 'Resetting & Seeding...' : 'Reset & Seed'}
            </Button>
          )}
          
          {hasSampleDataPermission && (
            <Button 
              onClick={handleClearTemplates}
              disabled={seeding || clearing || resetting}
              variant="destructive"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              {clearing ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
              {clearing ? 'Deactivating...' : 'Deactivate All'}
            </Button>
          )}
        </div>
      </div>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            System Templates Status
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
          <CardTitle>Available System Templates</CardTitle>
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
                        {CATEGORY_LABELS[template.subsystem || 'general']}
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
                  <span>Created: {lastSeedingResult.promptIds.length} prompts</span>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{lastSeedingResult.message}</AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clear Result */}
      {lastClearResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="text-red-600" size={20} />
              Template Clearing Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Trash2 className="text-red-600" size={16} />
                  <span>Cleared: {lastClearResult.deletedCount} prompts</span>
                </div>
              </div>

              <Alert>
                <Trash2 className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>⚠️ Warning:</strong> {lastClearResult.message}
                </AlertDescription>
              </Alert>
              
              {lastClearResult.deletedTemplates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-800">Cleared Templates:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {lastClearResult.deletedTemplates.map((templateName, index) => (
                      <div key={index} className="py-2 px-3 bg-red-50 text-red-800 rounded border border-red-200">
                        <span className="font-mono text-sm">{templateName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset and Seed Result */}
      {lastResetAndSeedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="text-blue-600" size={20} />
              Reset & Seed Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Trash2 className="text-red-600" size={16} />
                  <span>Cleared: {lastResetAndSeedResult.clearedCount} prompts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={16} />
                  <span>Seeded: {lastResetAndSeedResult.seededCount} prompts</span>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ Success:</strong> {lastResetAndSeedResult.message}
                </AlertDescription>
              </Alert>
              
              {lastResetAndSeedResult.clearedTemplates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-800">Templates Replaced:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {lastResetAndSeedResult.clearedTemplates.map((templateName, index) => (
                      <div key={index} className="py-2 px-3 bg-blue-50 text-blue-800 rounded border border-blue-200">
                        <span className="font-mono text-sm">{templateName}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
          <CardTitle>How System Prompt Management Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-600 mt-0.5" size={16} />
            <div>
              <strong>Safe Seeding:</strong> Only creates new prompts, never overwrites existing active prompts
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-600 mt-0.5" size={16} />
            <div>
              <strong>Hardcoded Templates:</strong> Templates defined in code are loaded into the database
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-600 mt-0.5" size={16} />
            <div>
              <strong>Version Management:</strong> Users can later modify prompts to create new versions
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-600 mt-0.5" size={16} />
            <div>
              <strong>Immediate Availability:</strong> Seeded prompts are immediately available for AI operations
            </div>
          </div>
          {hasSampleDataPermission && (
            <div className="flex items-start gap-2">
              <RotateCcw className="text-blue-600 mt-0.5" size={16} />
              <div>
                <strong className="text-blue-700">🔄 Reset & Seed:</strong> One-click operation to clear existing templates and seed fresh ones with updated configurations (no confirmations required)
              </div>
            </div>
          )}
          {hasSampleDataPermission && (
            <div className="flex items-start gap-2">
              <Trash2 className="text-red-600 mt-0.5" size={16} />
              <div>
                <strong className="text-red-700">⚠️ Clear Function:</strong> Sample data permission users can clear all prompts (destructive operation with multiple confirmations)
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}