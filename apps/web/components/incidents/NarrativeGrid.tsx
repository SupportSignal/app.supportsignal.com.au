// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '@starter/ui/card';
import { Label } from '@starter/ui/label';
import { Button } from '@starter/ui/button';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { Badge } from '@starter/ui/badge';
import { SampleDataButton } from './SampleDataButton';
import { Id } from '@/convex/_generated/dataModel';

interface NarrativeGridProps {
  incidentId: Id<"incidents">;
  onComplete: () => void;
  onBack: () => void;
}

interface NarrativeData {
  before_event: string;
  during_event: string;
  end_event: string;
  post_event: string;
}

/**
 * Multi-Phase Narrative Collection Grid - Step 2 of Incident Capture
 * Implements Story 3.1 AC 3.1.2: Multi-phase narrative collection
 * 
 * Features:
 * - 2x2 responsive grid layout for four narrative phases
 * - Large text areas optimized for detailed descriptions
 * - Real-time character counting and validation
 * - Auto-save functionality with visual indicators
 * - Minimum content requirements (at least one phase with 50+ characters)
 * - Mobile-responsive design (converts to single column on small screens)
 */
export function NarrativeGrid({ incidentId, onComplete, onBack }: NarrativeGridProps) {
  const [narrativeData, setNarrativeData] = useState<NarrativeData>({
    before_event: '',
    during_event: '',
    end_event: '',
    post_event: '',
  });

  const [errors, setErrors] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get session token for API calls
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('auth_session_token') : null;

  // Load existing incident data
  const incidentData = useQuery(
    api.incidents.getDraftIncident,
    sessionToken ? { sessionToken, incidentId } : 'skip'
  );

  const upsertNarrative = useMutation(api.incidents.upsertIncidentNarrative);
  const updateStatus = useMutation(api.incidents.updateStatus);

  // Load existing narrative data when available
  useEffect(() => {
    if (incidentData?.narrative) {
      setNarrativeData({
        before_event: incidentData.narrative.before_event || '',
        during_event: incidentData.narrative.during_event || '',
        end_event: incidentData.narrative.end_event || '',
        post_event: incidentData.narrative.post_event || '',
      });
    }
  }, [incidentData]);

  // Auto-save functionality
  const triggerAutoSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (hasChanges && sessionToken) {
        try {
          await upsertNarrative({
            sessionToken,
            incident_id: incidentId,
            before_event: narrativeData.before_event,
            during_event: narrativeData.during_event,
            end_event: narrativeData.end_event,
            post_event: narrativeData.post_event,
          });
          setLastSaveTime(new Date());
          setHasChanges(false);
          console.log('💾 AUTO-SAVE COMPLETED', {
            incidentId,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }
    }, 3000); // Auto-save after 3 seconds of inactivity
  };

  // Handle narrative field changes
  const handleNarrativeChange = (field: keyof NarrativeData, value: string) => {
    setNarrativeData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setErrors('');
    triggerAutoSave();
  };

  // Validate narratives
  const validateNarratives = (): boolean => {
    const narratives = Object.values(narrativeData);
    const hasMinimumContent = narratives.some(narrative => 
      narrative.trim().length >= 50
    );

    if (!hasMinimumContent) {
      setErrors('At least one narrative phase must contain meaningful content (minimum 50 characters)');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateNarratives()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!sessionToken) {
        throw new Error('No session token found');
      }

      // Save narratives
      await upsertNarrative({
        sessionToken,
        incident_id: incidentId,
        before_event: narrativeData.before_event,
        during_event: narrativeData.during_event,
        end_event: narrativeData.end_event,
        post_event: narrativeData.post_event,
      });

      // Update incident status to indicate narrative completion
      await updateStatus({
        sessionToken,
        id: incidentId,
        capture_status: 'in_progress',
      });

      console.log('📝 NARRATIVES COMPLETED', {
        incidentId,
        phasesConcluded: Object.values(narrativeData).filter(n => n.trim().length > 0).length,
        timestamp: new Date().toISOString(),
      });

      // For Story 3.1, complete the workflow here
      // In future stories (3.2, 3.3), this will proceed to AI clarification steps
      onComplete();
    } catch (error) {
      console.error('Failed to save narratives:', error);
      setErrors(error instanceof Error ? error.message : 'Failed to save narratives');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get character counts for each phase
  const getCharacterCount = (text: string) => text.length;
  const getWordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;

  // Check if minimum requirements are met
  const hasMinimumContent = Object.values(narrativeData).some(narrative => 
    narrative.trim().length >= 50
  );

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              📝 Step 2: Incident Narrative
              <span className="text-sm font-normal text-gray-500">
                (Detailed Description)
              </span>
            </div>
            <SampleDataButton
              onDataFilled={(scenarioData) => {
                // Fill narrative fields with sample data
                if (scenarioData.narratives) {
                  setNarrativeData({
                    before_event: scenarioData.narratives.before_event || '',
                    during_event: scenarioData.narratives.during_event || '',
                    end_event: scenarioData.narratives.end_event || '',
                    post_event: scenarioData.narratives.post_event || '',
                  });
                  setHasChanges(true);
                  console.log(`Narrative filled with sample data:`, scenarioData);
                }
              }}
              participantFirstName={incidentData?.participant_name?.split(' ')[0]}
              variant="ghost"
              size="sm"
            />
          </CardTitle>
          <p className="text-sm text-gray-600">
            Provide detailed descriptions for each phase of the incident. At least one phase must contain meaningful content.
          </p>
        </CardHeader>
      </Card>

      {/* Auto-save Status */}
      {hasChanges && (
        <Alert>
          <AlertDescription className="text-blue-600">
            <span className="animate-pulse">💾</span> Auto-saving changes...
          </AlertDescription>
        </Alert>
      )}

      {lastSaveTime && !hasChanges && (
        <Alert>
          <AlertDescription className="text-green-600">
            ✓ Saved at {lastSaveTime.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Narrative Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Event */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                🔍 Before Event
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getCharacterCount(narrativeData.before_event)} chars
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getWordCount(narrativeData.before_event)} words
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-sm text-gray-600 mb-2 block">
                What was happening before the incident? What were the circumstances or conditions leading up to it?
              </Label>
              <textarea
                value={narrativeData.before_event}
                onChange={(e) => handleNarrativeChange('before_event', e.target.value)}
                placeholder="Describe the situation, environment, activities, or conditions that existed before the incident occurred..."
                className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </CardContent>
          </Card>

          {/* During Event */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                ⚡ During Event
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getCharacterCount(narrativeData.during_event)} chars
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getWordCount(narrativeData.during_event)} words
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-sm text-gray-600 mb-2 block">
                What happened during the incident? Describe the event as it unfolded.
              </Label>
              <textarea
                value={narrativeData.during_event}
                onChange={(e) => handleNarrativeChange('during_event', e.target.value)}
                placeholder="Describe exactly what happened during the incident, including actions, behaviors, and sequence of events..."
                className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </CardContent>
          </Card>

          {/* End Event */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                🏁 End Event
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getCharacterCount(narrativeData.end_event)} chars
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getWordCount(narrativeData.end_event)} words
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-sm text-gray-600 mb-2 block">
                How did the incident end? What actions were taken to resolve or conclude it?
              </Label>
              <textarea
                value={narrativeData.end_event}
                onChange={(e) => handleNarrativeChange('end_event', e.target.value)}
                placeholder="Describe how the incident concluded, what interventions were used, and how the situation was resolved..."
                className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </CardContent>
          </Card>

          {/* Post-Event Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                🤝 Post-Event Support
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getCharacterCount(narrativeData.post_event)} chars
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getWordCount(narrativeData.post_event)} words
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-sm text-gray-600 mb-2 block">
                What support was provided after the incident? Follow-up actions or care given?
              </Label>
              <textarea
                value={narrativeData.post_event}
                onChange={(e) => handleNarrativeChange('post_event', e.target.value)}
                placeholder="Describe any immediate support, care, or follow-up provided after the incident concluded..."
                className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </CardContent>
          </Card>
        </div>

        {/* Validation Error */}
        {errors && (
          <Alert className="mt-4">
            <AlertDescription className="text-red-600">
              {errors}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Actions */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            ← Back to Incident Details
          </Button>

          <div className="flex items-center space-x-4">
            {/* Content Requirements Indicator */}
            <div className="text-sm">
              {hasMinimumContent ? (
                <Badge className="bg-green-100 text-green-800">
                  ✓ Minimum content met
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  Need 50+ chars in any phase
                </Badge>
              )}
            </div>

            <Button
              type="submit"
              disabled={!hasMinimumContent || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                'Complete Step 2 →'
              )}
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Step 2 of 7</span>
            <div className="flex space-x-1">
              <div className="w-8 h-1 bg-blue-600 rounded"></div>
              <div className="w-8 h-1 bg-blue-600 rounded"></div>
              <div className="w-8 h-1 bg-gray-300 rounded"></div>
              <div className="w-8 h-1 bg-gray-300 rounded"></div>
              <div className="w-8 h-1 bg-gray-300 rounded"></div>
              <div className="w-8 h-1 bg-gray-300 rounded"></div>
              <div className="w-8 h-1 bg-gray-300 rounded"></div>
            </div>
            <span className="text-xs text-gray-500">
              Steps 3-7 coming in next release
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}