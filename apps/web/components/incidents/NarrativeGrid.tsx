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
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Id } from '@/convex/_generated/dataModel';

interface NarrativeGridProps {
  incidentId: Id<"incidents">;
  onComplete: (narrativeData: NarrativeData) => void;
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

  // Get session token for API calls
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('auth_session_token') : null;

  // Convex mutations
  const createNarrative = useMutation(api.narratives.create);
  const updateNarrative = useMutation(api.narratives.update);

  // Upsert function that tries update first, then create
  const upsertNarrative = async (data: NarrativeData & { sessionToken: string; incident_id: Id<"incidents"> }) => {
    try {
      // Try to update first
      await updateNarrative(data);
    } catch (error: any) {
      // If narrative doesn't exist, create it first then update
      if (error?.message?.includes('Narrative not found')) {
        await createNarrative({
          sessionToken: data.sessionToken,
          incident_id: data.incident_id,
        });
        
        // Now update with the data
        await updateNarrative(data);
      } else {
        throw error; // Re-throw other errors
      }
    }
  };

  // Auto-save hook
  const { autoSaveState, triggerSave } = useAutoSave(
    narrativeData,
    async (data) => {
      if (!sessionToken) throw new Error('No session token');
      
      await upsertNarrative({
        sessionToken,
        incident_id: incidentId,
        before_event: data.before_event,
        during_event: data.during_event,
        end_event: data.end_event,
        post_event: data.post_event,
      });
    },
    {
      debounceMs: 3000,
      enabled: !!sessionToken && !!incidentId,
      onSuccess: () => {
        console.log('💾 AUTO-SAVE COMPLETED', {
          incidentId,
          timestamp: new Date().toISOString(),
        });
      },
      onError: (error) => {
        console.warn('Auto-save failed:', error);
      },
    }
  );

  // Load existing incident data
  const incidentData = useQuery(
    api.incidents.getDraftIncident,
    sessionToken ? { sessionToken, incidentId } : 'skip'
  );

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

  // Sample data scenarios (simplified version from SampleDataButton)
  const getSampleNarrative = () => {
    const scenarios = [
      {
        before_event: "The participant was scheduled to receive afternoon medications at 2:30 PM as per their medication chart. The support worker arrived at 2:25 PM and began preparing medications. The participant was in the living room watching television and appeared in good spirits. They had eaten lunch at 12:30 PM and had no complaints of pain or discomfort. Their morning medications had been administered correctly at 8:00 AM with no issues.",
        during_event: "At 2:30 PM, the support worker administered what they believed to be the participant's prescribed Paracetamol 500mg. However, upon checking the medication chart immediately after administration, they realized they had given two tablets instead of the prescribed one tablet. The participant had already swallowed both tablets before the error was noticed. The worker immediately checked for any immediate reactions and found none.",
        end_event: "The medication error was identified within 2 minutes of administration. The participant showed no immediate adverse reactions - vital signs appeared normal, they were alert and responsive, and complained of no symptoms. The support worker immediately contacted the on-call nurse at 2:32 PM to report the incident and seek medical advice.",
        post_event: "The on-call nurse advised monitoring the participant for the next 4 hours for any signs of overdose symptoms. The participant's doctor was contacted and advised that the additional 500mg of Paracetamol was not life-threatening but required monitoring. The participant remained stable throughout the monitoring period. Incident was reported to management at 3:00 PM. A review of medication procedures has been scheduled to prevent similar errors."
      },
      {
        before_event: "The participant was attending their weekly social group activity at the community center. They had arrived at 3:00 PM in their wheelchair, transported by community transport. The participant was in good spirits and excited about the craft activity planned for the session. Their wheelchair had been checked that morning and was functioning normally. The activity hall floor was clean and dry.",
        during_event: "At approximately 4:45 PM, the participant attempted to transfer from their wheelchair to a regular chair to participate in the craft activity. Despite staff assistance and following the transfer procedure, the participant lost their balance during the transfer. They fell backward and hit their head on the corner of a nearby table. Staff immediately attended to the participant, who was conscious but complained of head pain.",
        end_event: "The participant was immediately assessed by the first aid qualified staff member. They remained conscious and alert but had a visible bump on the back of their head and complained of headache. The participant was kept still while emergency services were called at 4:50 PM. Their wheelchair was checked and found to be functioning normally - the fall appeared to be related to the transfer process.",
        post_event: "Ambulance arrived at 5:10 PM. The participant was transported to the hospital for assessment and CT scan. The scan showed no serious injury, but they were advised to rest and monitor for concussion symptoms. The participant's family and support coordinator were notified. A review of transfer procedures and equipment has been initiated. The participant returned home that evening with instructions for 24-hour observation."
      },
      {
        before_event: "The participant arrived at the day program at 9:00 AM as usual. They seemed slightly agitated during the morning greeting but participated in the breakfast routine. The participant mentioned they had difficulty sleeping the previous night and were feeling tired. The morning activity was a group discussion about weekend plans, which the participant initially engaged with positively.",
        during_event: "During the group discussion at 10:15 AM, the participant became increasingly agitated when another participant disagreed with their weekend suggestion. The participant raised their voice and began using inappropriate language directed at the other participant and staff. When a staff member attempted to de-escalate the situation, the participant became more aggressive, shouting and making threatening gestures but did not make physical contact.",
        end_event: "Staff implemented the de-escalation protocol, removing other participants from the immediate area and speaking calmly to the participant. After approximately 10 minutes, the participant began to calm down. They were offered the opportunity to take a break in a quiet space, which they accepted. The participant expressed remorse about their behavior and explained they were frustrated about their sleep issues.",
        post_event: "The participant spent 30 minutes in the quiet room with a support worker, using breathing techniques to calm down. They were then able to rejoin the group for the next activity. A behavior support meeting was scheduled for the following week to review the participant's support strategies. The participant's sleep issues were noted for discussion with their healthcare team."
      }
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  };

  // Listen for sample data trigger from Developer Tools Bar
  useEffect(() => {
    const handleSampleDataEvent = (event: CustomEvent) => {
      if (event.detail.type === 'narrative') {
        const sampleData = getSampleNarrative();
        setNarrativeData(sampleData);
        setErrors(''); // Clear any existing errors
        console.log('✅ Narrative filled with sample data');
      }
    };

    window.addEventListener('triggerSampleData', handleSampleDataEvent as EventListener);
    return () => {
      window.removeEventListener('triggerSampleData', handleSampleDataEvent as EventListener);
    };
  }, []);

  // Handle narrative field changes
  const handleNarrativeChange = (field: keyof NarrativeData, value: string) => {
    setNarrativeData(prev => ({ ...prev, [field]: value }));
    setErrors('');
    // Auto-save will be triggered automatically by useAutoSave hook when narrativeData changes
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

      // For Story 3.2+, pass narrative data to trigger proactive question generation
      onComplete(narrativeData);
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
            <div className="flex items-center gap-4">
              {/* Auto-save Status Indicator */}
              <AutoSaveIndicator 
                autoSaveState={autoSaveState} 
                variant="status-bar" 
              />
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Provide detailed descriptions for each phase of the incident. At least one phase must contain meaningful content.
          </p>
        </CardHeader>
      </Card>


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

      </form>
    </div>
  );
}