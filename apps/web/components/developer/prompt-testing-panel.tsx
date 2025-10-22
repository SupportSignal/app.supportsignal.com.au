// @ts-nocheck
/**
 * PromptTestingPanel Component - Direct Production Prompt Editing
 * 
 * Real-time prompt editing interface with 2-column layout:
 * Column 1: Dropdown, meta prompt (editable), final prompt with live interpolation
 * Column 2: Property grid with green indicators for template matches
 * 
 * DIRECT EDITING CONCEPT:
 * 
 * Simplified architecture that directly modifies production prompts:
 * 
 * 1. DIRECT PRODUCTION EDITING:
 *    - No session management or scope complexity
 *    - Edit production prompts directly in the database
 *    - Changes take effect immediately for regeneration operations
 * 
 * 2. LIVE INTERPOLATION:
 *    - Real-time template variable substitution preview
 *    - Shows final prompt that will be sent to AI services
 *    - Visual indicators for matched vs missing template variables
 * 
 * 3. SIMPLIFIED WORKFLOW:
 *    - Eye icon toggles panel expansion/collapse
 *    - Select prompt → edit template → save changes → regenerate
 *    - No session cleanup or expiration management needed
 * 
 * 4. VISUAL FEEDBACK:
 *    - "Direct Production Editing" badge when active
 *    - Save/Reset buttons appear when template is modified
 *    - Green indicators show variables matching template placeholders
 * 
 * 5. INTERACTION LIFECYCLE:
 *    - EXPAND: Eye icon clicked → panel expands → select prompt
 *    - EDIT: Modify template → Save button appears → click Save
 *    - TEST: Use regenerate buttons in workflow to test changes
 *    - COLLAPSE: Eye icon clicked again → panel collapses
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@starter/ui/button';
import { Separator } from '@starter/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Textarea } from '@starter/ui/textarea';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { 
  Code2, 
  Play, 
  Copy, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Settings2,
  Zap,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasDeveloperAccess } from '@/lib/utils/developerAccess';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';

interface PromptTestingPanelProps {
  user: any;
  incidentId?: Id<"incidents">;
  currentStep?: number;
  contextData?: any;
  className?: string;
}

interface PromptInfo {
  prompt_name: string;
  prompt_template: string;
  ai_model?: string;
  max_tokens?: number;
  temperature?: number;
  scope?: string;
}

interface TemplateValidation {
  processedTemplate: string;
  substitutions: Record<string, string>;
  missingPlaceholders: string[];
  unusedVariables: string[];
}

export function PromptTestingPanel({
  user,
  incidentId,
  currentStep = 1,
  contextData,
  className
}: PromptTestingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPromptName, setSelectedPromptName] = useState<string>('');
  const [customVariables, setCustomVariables] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<string>('');
  const [hasTemplateChanges, setHasTemplateChanges] = useState(false);
  
  // Copy button states for visual feedback
  const [templateCopyStatus, setTemplateCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [resolvedCopyStatus, setResolvedCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);

  // Mutation for updating prompt template
  const updatePromptTemplate = useMutation(api.promptManager.updatePromptTemplate);

  // Check developer access using shared logic - MOVED BEFORE EARLY RETURN
  const hasAccess = useMemo(() => hasDeveloperAccess(user), [user]);

  // Get incident data for variable extraction - MOVED BEFORE EARLY RETURN
  const incident = useQuery(api.incidents.getById, 
    incidentId && user?.sessionToken ? { 
      sessionToken: user.sessionToken,
      id: incidentId 
    } : "skip"
  );

  // Get incident narrative data for phase-specific variables - MOVED BEFORE EARLY RETURN
  const narrative = useQuery(api.incidents.getIncidentNarrative, 
    incidentId ? { incident_id: incidentId } : "skip"
  );

  // Available prompts - show ALL prompts for developer testing flexibility - MOVED BEFORE EARLY RETURN
  const availablePrompts = useMemo(() => {
    return [
      // All clarification question prompts
      'generate_clarification_questions_before_event',
      'generate_clarification_questions_during_event',
      'generate_clarification_questions_end_event',
      'generate_clarification_questions_post_event',
      // Phase-specific enhancement prompts (Story 6.4)
      'enhance_narrative_before_event',
      'enhance_narrative_during_event',
      'enhance_narrative_end_event',
      'enhance_narrative_post_event',
    ];
  }, []);

  // Get current prompt - MOVED BEFORE EARLY RETURN
  const currentPrompt = useQuery(api.promptManager.getActivePrompt,
    selectedPromptName ? {
      prompt_name: selectedPromptName,
      subsystem: "incidents",
    } : "skip"
  );

  // Get current template for processing (edited or original) - MOVED BEFORE EARLY RETURN
  const currentTemplate = editedTemplate || currentPrompt?.prompt_template || '';

  // Process template with current variables - MOVED BEFORE EARLY RETURN
  const templateValidation = useQuery(api.promptManager.processTemplateWithValidationQuery,
    currentTemplate && incident ? {
      template: currentTemplate,
      variables: {
        // Base variables from incident
        participantName: incident.participant_name,
        reporterName: incident.reporter_name,
        location: incident.location,
        eventDateTime: incident.event_date_time,
        phase: currentStep >= 3 && currentStep <= 6 ?
          ['before_event', 'during_event', 'end_event', 'post_event'][currentStep - 3] : 'before_event',

        // Phase-specific narrative variables
        beforeEvent: narrative?.before_event || 'No before event narrative yet',
        duringEvent: narrative?.during_event || 'No during event narrative yet',
        endEvent: narrative?.end_event || 'No end event narrative yet',
        postEvent: narrative?.post_event || 'No post event narrative yet',

        // Story 6.4: Enhancement prompt variables
        // originalNarrative = current phase's narrative content
        originalNarrative: currentStep >= 3 && currentStep <= 6 ?
          [narrative?.before_event, narrative?.during_event, narrative?.end_event, narrative?.post_event][currentStep - 3] || 'No narrative content yet' :
          'No narrative content yet',

        // investigationQA = placeholder for clarification Q&A (actual value comes from backend at runtime)
        investigationQA: 'Q: Sample clarification question?\nA: Sample clarification answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',

        // Phase-specific Q&A variables (Story 6.4)
        beforeEventQA: 'Q: Sample before event clarification question?\nA: Sample before event answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',
        duringEventQA: 'Q: Sample during event clarification question?\nA: Sample during event answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',
        endEventQA: 'Q: Sample end event clarification question?\nA: Sample end event answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',
        postEventQA: 'Q: Sample post event clarification question?\nA: Sample post event answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',

        // Custom developer variables
        ...customVariables,
      },
    } : "skip"
  );

  // Base variables from incident - MOVED BEFORE EARLY RETURN
  const baseVariables = useMemo(() => {
    if (!incident) return {};

    return {
      participantName: incident.participant_name || '',
      reporterName: incident.reporter_name || '',
      location: incident.location || '',
      eventDateTime: incident.event_date_time || '',
      phase: currentStep >= 3 && currentStep <= 6 ?
        ['before_event', 'during_event', 'end_event', 'post_event'][currentStep - 3] : 'before_event',

      // Phase-specific narrative variables
      beforeEvent: narrative?.before_event || 'No before event narrative yet',
      duringEvent: narrative?.during_event || 'No during event narrative yet',
      endEvent: narrative?.end_event || 'No end event narrative yet',
      postEvent: narrative?.post_event || 'No post event narrative yet',

      // Story 6.4: Enhancement prompt variables
      originalNarrative: currentStep >= 3 && currentStep <= 6 ?
        [narrative?.before_event, narrative?.during_event, narrative?.end_event, narrative?.post_event][currentStep - 3] || 'No narrative content yet' :
        'No narrative content yet',
      investigationQA: 'Q: Sample clarification question?\nA: Sample clarification answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',

      // Phase-specific Q&A variables (Story 6.4)
      beforeEventQA: 'Q: Sample before event clarification question?\nA: Sample before event answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',
      duringEventQA: 'Q: Sample during event clarification question?\nA: Sample during event answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',
      endEventQA: 'Q: Sample end event clarification question?\nA: Sample end event answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',
      postEventQA: 'Q: Sample post event clarification question?\nA: Sample post event answer.\n\n(Actual Q&A responses will be loaded from the database when enhancement runs)',
    };
  }, [incident, currentStep, narrative]);

  // All variables (base + custom) - MOVED BEFORE EARLY RETURN
  const allVariables = useMemo(() => ({
    ...baseVariables,
    ...customVariables,
  }), [baseVariables, customVariables]);

  // Sync edited template when prompt changes - MOVED BEFORE EARLY RETURN
  useEffect(() => {
    if (currentPrompt && !hasTemplateChanges) {
      setEditedTemplate(currentPrompt.prompt_template);
    }
  }, [currentPrompt, hasTemplateChanges]);

  // Don't render if user doesn't have access
  if (!user || !hasAccess) {
    return null;
  }

  // Toggle panel expansion
  const toggleExpansion = () => {
    if (!isExpanded) {
      // Expand panel
      setIsExpanded(true);
      if (availablePrompts.length > 0 && !selectedPromptName) {
        setSelectedPromptName(availablePrompts[0]);
      }
    } else {
      // Collapse panel
      setIsExpanded(false);
      setSelectedPromptName('');
      setCustomVariables({});
      setEditedTemplate('');
      setHasTemplateChanges(false);
    }
  };

  // Handle template editing
  const handleTemplateChange = (newTemplate: string) => {
    setEditedTemplate(newTemplate);
    setHasTemplateChanges(newTemplate !== (currentPrompt?.prompt_template || ''));
  };

  // Reset template to original
  const resetTemplate = () => {
    setEditedTemplate(currentPrompt?.prompt_template || '');
    setHasTemplateChanges(false);
  };

  // Save template changes to production database
  const saveTemplateChanges = async () => {
    if (!currentPrompt || !hasTemplateChanges || !user?.sessionToken || !selectedPromptName) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await updatePromptTemplate({
        sessionToken: user.sessionToken,
        prompt_name: selectedPromptName,
        new_template: editedTemplate,
        subsystem: "incidents",
      });

      if (result.success) {
        setHasTemplateChanges(false);
        toast.success(`Template "${selectedPromptName}" saved to production database`);
        console.log('✅ Template saved:', result);
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error(`Failed to save template: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy template (raw prompt with variables)
  const copyTemplate = async () => {
    console.log('🔍 copyTemplate called', { currentTemplate: currentTemplate?.slice(0, 50) });
    setTemplateCopyStatus('copying');
    
    try {
      if (!currentTemplate || !currentTemplate.trim()) {
        console.log('🔍 No template to copy');
        setTemplateCopyStatus('error');
        toast.error("No template content to copy");
        setTimeout(() => setTemplateCopyStatus('idle'), 2000);
        return;
      }
      
      await navigator.clipboard.writeText(currentTemplate);
      console.log('🔍 Template copied successfully');
      setTemplateCopyStatus('success');
      toast.success("Template copied to clipboard");
      
      // Reset status after 2 seconds
      setTimeout(() => setTemplateCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('🔍 Failed to copy template:', error);
      setTemplateCopyStatus('error');
      toast.error("Failed to copy template");
      setTimeout(() => setTemplateCopyStatus('idle'), 3000);
    }
  };

  // Copy resolved prompt for external testing
  const copyResolvedPrompt = async () => {
    console.log('🔍 copyResolvedPrompt called', { 
      hasValidation: !!templateValidation, 
      processedTemplate: templateValidation?.processedTemplate?.slice(0, 50) 
    });
    setResolvedCopyStatus('copying');
    
    try {
      if (templateValidation && templateValidation.processedTemplate) {
        await navigator.clipboard.writeText(templateValidation.processedTemplate);
        console.log('🔍 Resolved prompt copied successfully');
        setResolvedCopyStatus('success');
        toast.success("Final prompt copied to clipboard");
        
        // Reset status after 2 seconds
        setTimeout(() => setResolvedCopyStatus('idle'), 2000);
      } else {
        console.log('🔍 No resolved prompt to copy');
        setResolvedCopyStatus('error');
        toast.error("No resolved prompt to copy");
        setTimeout(() => setResolvedCopyStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('🔍 Failed to copy resolved prompt:', error);
      setResolvedCopyStatus('error');
      toast.error("Failed to copy prompt");
      setTimeout(() => setResolvedCopyStatus('idle'), 3000);
    }
  };

  // Helper functions for copy button visual feedback
  const getTemplateCopyIcon = () => {
    switch (templateCopyStatus) {
      case 'copying':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Copy className="h-3 w-3" />;
    }
  };

  const getResolvedCopyIcon = () => {
    switch (resolvedCopyStatus) {
      case 'copying':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Copy className="h-3 w-3" />;
    }
  };

  const getCopyButtonClassName = (status: 'idle' | 'copying' | 'success' | 'error') => {
    const baseClass = "h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100";
    
    switch (status) {
      case 'copying':
        return `${baseClass} text-blue-500`;
      case 'success':
        return `${baseClass} text-green-500`;
      case 'error':
        return `${baseClass} text-red-500`;
      default:
        return baseClass;
    }
  };

  // Create new variable
  const addCustomVariable = (key: string, value: string) => {
    setCustomVariables(prev => ({ ...prev, [key]: value }));
  };

  // Remove variable
  const removeCustomVariable = (key: string) => {
    setCustomVariables(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };


  return (
    <div className={cn("border-t border-gray-200 bg-gray-50/50", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Prompt Testing</span>
          {isExpanded && (
            <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
              Direct Production Editing
            </Badge>
          )}
          {templateValidation && (
            <Badge variant="outline" className="text-xs border-green-300 text-green-600">
              Live Interpolation
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpansion}
            disabled={isLoading}
            className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-100"
            title={isExpanded ? "Collapse testing panel" : "Expand testing panel"}
          >
            {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* 2-Column Testing Interface */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Column 1: Dropdown, Meta Prompt, Final Prompt */}
            <div className="space-y-4">
              {/* Prompt Dropdown */}
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  Active Prompt
                </Label>
                <select
                  value={selectedPromptName}
                  onChange={(e) => setSelectedPromptName(e.target.value)}
                  className="w-full mt-1 text-xs border rounded px-2 py-1 bg-white"
                >
                  <option value="">Select a prompt...</option>
                  <optgroup label="Clarification Questions">
                    <option value="generate_clarification_questions_before_event">
                      Before Event Questions
                    </option>
                    <option value="generate_clarification_questions_during_event">
                      During Event Questions
                    </option>
                    <option value="generate_clarification_questions_end_event">
                      End Event Questions
                    </option>
                    <option value="generate_clarification_questions_post_event">
                      Post Event Questions
                    </option>
                  </optgroup>
                  <optgroup label="Enhancement">
                    <option value="enhance_narrative_before_event">
                      Before Event Enhancement
                    </option>
                    <option value="enhance_narrative_during_event">
                      During Event Enhancement
                    </option>
                    <option value="enhance_narrative_end_event">
                      End Event Enhancement
                    </option>
                    <option value="enhance_narrative_post_event">
                      Post Event Enhancement
                    </option>
                  </optgroup>
                </select>
              </div>

              {/* Meta Prompt (Editable Template) */}
              {currentPrompt && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                      Meta Prompt (Template)
                      {hasTemplateChanges && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-gray-300 text-gray-600">
                          Modified
                        </Badge>
                      )}
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyTemplate}
                        disabled={templateCopyStatus === 'copying'}
                        className={getCopyButtonClassName(templateCopyStatus)}
                        title="Copy template"
                      >
                        {getTemplateCopyIcon()}
                      </Button>
                      {hasTemplateChanges && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={saveTemplateChanges}
                            disabled={isSaving}
                            className="h-6 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={resetTemplate}
                            className="h-6 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            Reset
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={currentTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className={`text-xs h-64 font-mono resize-none ${
                        hasTemplateChanges 
                          ? 'bg-gray-50 border-gray-200 focus:border-gray-400' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                      placeholder="Edit prompt template..."
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-gray-400">
                      <Settings2 className="h-3 w-3" />
                      {hasTemplateChanges ? 'Modified' : 'Template'}
                    </div>
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-1 rounded">
                      {currentTemplate.length} chars • {currentTemplate.split('\n').length} lines
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>Model: {currentPrompt.ai_model || 'default'}</span>
                    <span>•</span>
                    <span>Max Tokens: {currentPrompt.max_tokens || 'default'}</span>
                    <span>•</span>
                    <span>Temp: {currentPrompt.temperature || 'default'}</span>
                  </div>
                </div>
              )}

              {/* Final Prompt (Live Interpolation) */}
              {templateValidation && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-medium text-gray-700">Final Prompt (Live Interpolation)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyResolvedPrompt}
                        disabled={resolvedCopyStatus === 'copying'}
                        className={getCopyButtonClassName(resolvedCopyStatus)}
                        title="Copy final prompt"
                      >
                        {getResolvedCopyIcon()}
                      </Button>
                      {templateValidation.missingPlaceholders.length === 0 ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs">{templateValidation.missingPlaceholders.length} missing</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Textarea
                        value={templateValidation.processedTemplate}
                        readOnly
                        className="text-xs h-40 font-mono bg-blue-50 border-blue-200 resize-none"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-blue-500">
                        <Zap className="h-3 w-3" />
                        Live
                      </div>
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-1 rounded">
                        {templateValidation.processedTemplate.length} chars
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex flex-wrap gap-2">
                      {templateValidation.missingPlaceholders.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs font-medium">Missing:</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {templateValidation.missingPlaceholders.map((placeholder) => (
                              <code key={placeholder} className="text-xs bg-amber-100 text-amber-800 px-1 rounded">
                                {`{{${placeholder}}}`}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {templateValidation.unusedVariables.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Settings2 className="h-3 w-3" />
                            <span className="text-xs font-medium">Unused:</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {templateValidation.unusedVariables.map((variable) => (
                              <code key={variable} className="text-xs bg-gray-100 text-gray-700 px-1 rounded">
                                {variable}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Copy functionality moved to header icons */}
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Property Grid with Green Indicators */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700">Variable Properties</Label>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Template Match</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Base Data</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span>Custom</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {/* Base Variables - Sorted with Template Placeholders First */}
                {(() => {
                  const entries = Object.entries(baseVariables);
                  
                  // Extract placeholder order from current template (deduplicated)
                  const template = currentTemplate || '';
                  const placeholderMatches = template.match(/\{\{\s*([^}]+)\s*\}\}/g) || [];
                  const allPlaceholders = placeholderMatches.map(match => 
                    match.replace(/[{}]/g, '').trim()
                  );
                  // Remove duplicates while preserving first occurrence order
                  const templateOrder = [...new Set(allPlaceholders)];
                  
                  // Get substitutions from template validation
                  const substitutions = templateValidation?.substitutions || {};
                  
                  // Sort: matched placeholders first (in template order), then unmatched
                  const matched = templateOrder
                    .filter(placeholder => placeholder in baseVariables)
                    .map(placeholder => [placeholder, baseVariables[placeholder]]);
                  
                  const unmatched = entries
                    .filter(([key]) => !templateOrder.includes(key))
                    .sort(([a], [b]) => a.localeCompare(b)); // Sort unmatched alphabetically
                  
                  const sortedEntries = [...matched, ...unmatched];
                  
                  return sortedEntries.map(([key, value]) => {
                    const isMatched = key in substitutions;
                    
                    return (
                      <div key={key} className="bg-white rounded border p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isMatched ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                          <Label className="text-xs font-medium text-gray-700 flex-1">{key}</Label>
                          <Badge variant="outline" className="text-xs px-1.5 py-0 border-blue-300 text-blue-600">
                            incident
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                          {String(value) || '(empty)'}
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* Custom Variables */}
                {Object.entries(customVariables).map(([key, value]) => {
                  const isMatched = templateValidation ? 
                    Object.keys(templateValidation.substitutions).includes(key) : false;
                  
                  return (
                    <div key={key} className="bg-white rounded border p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          isMatched ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                        <Label className="text-xs font-medium text-gray-700 flex-1">{key}</Label>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-gray-300 text-gray-600">
                          custom
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomVariable(key)}
                          className="h-4 w-4 p-0 text-gray-400 hover:text-red-500"
                        >
                          ×
                        </Button>
                      </div>
                      <Input
                        value={String(value)}
                        onChange={(e) => setCustomVariables(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                        className="text-xs"
                      />
                    </div>
                  );
                })}

                {/* Add Custom Variable */}
                <div className="bg-gray-50 rounded border p-2">
                  <Label className="text-xs font-medium text-gray-600 mb-2 block">Add Custom Variable</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="key"
                      className="text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement;
                          const valueInput = target.nextElementSibling as HTMLInputElement;
                          if (target.value.trim() && valueInput?.value.trim()) {
                            addCustomVariable(target.value.trim(), valueInput.value.trim());
                            target.value = '';
                            valueInput.value = '';
                          }
                        }
                      }}
                    />
                    <Input
                      placeholder="value"
                      className="text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement;
                          const keyInput = target.previousElementSibling as HTMLInputElement;
                          if (target.value.trim() && keyInput?.value.trim()) {
                            addCustomVariable(keyInput.value.trim(), target.value.trim());
                            keyInput.value = '';
                            target.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Press Enter to add</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-4">
              {templateValidation && (
                <>
                  <span>Variables: {Object.keys(allVariables).length}</span>
                  <span>Substitutions: {Object.keys(templateValidation.substitutions).length}</span>
                </>
              )}
            </div>
            <div className="text-blue-600">
              ● Production Prompt Editing Active
            </div>
          </div>
        </div>
      )}
    </div>
  );
}