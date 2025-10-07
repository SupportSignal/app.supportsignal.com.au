// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '@starter/ui/card';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Button } from '@starter/ui/button';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { ParticipantSelector } from '@/components/participants/participant-selector';
import { Id } from '@/convex/_generated/dataModel';
import { Participant } from '@/types/participants';
import { useViewport } from '@/hooks/mobile/useViewport';
import { cn } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  company_id: Id<"companies">;
}

interface IncidentMetadataFormProps {
  user: User;
  onComplete: (incidentId: Id<"incidents">) => void;
  existingIncidentId?: Id<"incidents"> | null;
}

interface FormData {
  reporter_name: string;
  participant_id: Id<"participants"> | undefined;
  participant_name: string;
  event_date_time: string;
  location: string;
}

/**
 * Incident Metadata Collection Form - Step 1 of Incident Capture
 * Implements Story 3.1 AC 3.1.1: Incident metadata collection
 * 
 * Features:
 * - Reporter name pre-filled from authenticated user
 * - Participant selection with searchable dropdown
 * - Date/time picker with current date/time default
 * - Location input with validation
 * - Real-time form validation
 * - Auto-save functionality (placeholder for future implementation)
 */
export function IncidentMetadataForm({ 
  user, 
  onComplete, 
  existingIncidentId 
}: IncidentMetadataFormProps) {
  const viewport = useViewport();
  const [formData, setFormDataInternal] = useState<FormData>(() => {
    const initialDateTime = new Date().toISOString().slice(0, 16);
    console.log('🔍 DEBUG: Initial form state creation:');
    console.log('   Initial event_date_time:', initialDateTime);
    console.log('   Current Date():', new Date());
    console.log('   Current Date().toString():', new Date().toString());
    console.log('   Current Date().toISOString():', new Date().toISOString());
    console.log('   User timezone offset (minutes):', new Date().getTimezoneOffset());
    
    return {
      reporter_name: user.name, // Pre-fill from authenticated user
      participant_id: undefined,
      participant_name: '',
      event_date_time: initialDateTime, // Current date/time in local format
      location: '',
    };
  });

  // Wrapper to log all form data changes (for debugging)
  const setFormData = (updater: React.SetStateAction<FormData>) => {
    setFormDataInternal(prevData => {
      const newData = typeof updater === 'function' ? updater(prevData) : updater;
      
      // Log any changes to event_date_time (development only)
      if (process.env.NODE_ENV === 'development' && prevData.event_date_time !== newData.event_date_time) {
        console.log('🔍 DEBUG: Form date/time changed:');
        console.log('   Previous value:', prevData.event_date_time);
        console.log('   New value:', newData.event_date_time);
      }
      
      return newData;
    });
  };

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [currentIncidentId, setCurrentIncidentId] = useState<Id<"incidents"> | null>(existingIncidentId || null);
  const [sampleDataError, setSampleDataError] = useState<string | null>(null);



  const createIncident = useMutation(api.incidents.create);
  const updateIncidentMetadata = useMutation(api.incidents.updateMetadata);
  const generateRandomData = useMutation(api.incidents.createSampleData.generateRandomIncidentMetadata);

  // Load existing incident data if editing
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('auth_session_token') : null;
  const existingIncident = useQuery(
    api.incidents.getDraftIncident,
    existingIncidentId && sessionToken ? { sessionToken, incidentId: existingIncidentId } : 'skip'
  );


  // Track if we've already loaded the initial data to prevent overwriting user changes
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Load existing incident data into form when available (only once)
  useEffect(() => {
    if (existingIncident?.incident) {
      if (!hasLoadedInitialData) {
        const incident = existingIncident.incident;
        console.log('🔍 DEBUG: Loading initial incident data (first time only)');
        setHasLoadedInitialData(true);
      
      // Format the event_date_time for datetime-local input
      let formattedDateTime = new Date().toISOString().slice(0, 16); // Default fallback
      if (incident.event_date_time) {
        try {
          console.log('🔍 DEBUG: Loading existing incident date/time data:');
          console.log('   Raw stored value:', incident.event_date_time);
          console.log('   Type:', typeof incident.event_date_time);
          
          // Parse the stored date/time and format it for datetime-local input
          // Important: datetime-local input expects local timezone, not UTC
          const date = new Date(incident.event_date_time);
          console.log('   Parsed Date object:', date);
          console.log('   Date toString():', date.toString());
          console.log('   Date toISOString():', date.toISOString());
          console.log('   Date getTime():', date.getTime());
          console.log('   User timezone offset (minutes):', date.getTimezoneOffset());
          
          // Convert to local timezone format for datetime-local input
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          console.log('   Extracted components:', { year, month, day, hours, minutes });
          
          formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
          console.log('   Final formatted value for datetime-local:', formattedDateTime);
        } catch (error) {
          console.warn('Failed to parse existing event_date_time, using current time as fallback:', incident.event_date_time);
          console.error('   Error details:', error);
        }
      }
      
      const newFormData = {
        reporter_name: incident.reporter_name || user.name,
        participant_id: incident.participant_id,
        participant_name: incident.participant_name || '',
        event_date_time: formattedDateTime,
        location: incident.location || '',
      };

      setFormData(newFormData);

      // If there's a participant, create the participant object for the selector
      if (incident.participant_id && incident.participant_name) {
        
        const [firstName, ...lastNameParts] = incident.participant_name.split(' ');
        const participantData = {
          _id: incident.participant_id,
          first_name: firstName,
          last_name: lastNameParts.join(' '),
          ndis_number: '',
          support_level: 'medium' as const, // Default support level
          contact_phone: '',
          care_notes: '',
          status: 'active' as const,
          company_id: user.company_id,
          created_at: Date.now(),
          updated_at: Date.now(),
        } as Participant;

        setSelectedParticipant(participantData);
        } else {
          setSelectedParticipant(null);
        }
      } else {
        console.log('🔍 DEBUG: Existing incident data available, but skipping load to preserve user changes');
      }
    }
  }, [existingIncident, user.name, hasLoadedInitialData]);

  // Handle random sample data generation using centralized service
  const handleRandomSample = async () => {
    const sessionToken = localStorage.getItem('auth_session_token');
    if (!sessionToken) {
      console.warn('No session token available for sample data generation');
      return;
    }

    try {
      const result = await generateRandomData({
        sessionToken,
        excludeFields: ['reporter_name'] // Don't update reporter name as requested
      });

      if (result.success && result.data) {
        console.log('🔍 DEBUG: Sample data generation result:');
        console.log('   Full result.data:', result.data);
        console.log('   Sample event_date_time:', result.data.event_date_time);
        console.log('   Sample event_date_time type:', typeof result.data.event_date_time);
        if (result.data.event_date_time) {
          console.log('   Sample parsed as Date:', new Date(result.data.event_date_time));
          console.log('   Sample Date toString():', new Date(result.data.event_date_time).toString());
        }
        
        // Update form with centralized sample data
        setFormData(prev => ({
          ...prev,
          ...result.data
        }));

        // Update selected participant for the selector using metadata
        if (result.metadata?.participant) {
          const participant = {
            _id: result.metadata.participant.id,
            first_name: result.metadata.participant.name.split(' ')[0],
            last_name: result.metadata.participant.name.split(' ').slice(1).join(' '),
            ndis_number: result.metadata.participant.ndis_number,
          };
          setSelectedParticipant(participant as Participant);
        }

        // Clear any existing errors for updated fields
        setErrors(prev => ({ 
          ...prev, 
          participant_name: undefined,
          location: undefined,
          event_date_time: undefined 
        }));

      }
    } catch (error) {
      console.error('Failed to generate random sample data:', error);
      
      // Show user-friendly error with guidance
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate sample data';
      setSampleDataError(errorMessage);
      
      // Clear error after 10 seconds
      setTimeout(() => setSampleDataError(null), 10000);
    }
  };

  // Listen for sample data trigger from Developer Tools Bar
  useEffect(() => {
    const handleSampleDataEvent = (event: CustomEvent) => {
      if (event.detail.type === 'form') {
        handleRandomSample();
      }
    };

    window.addEventListener('triggerSampleData', handleSampleDataEvent as EventListener);
    return () => {
      window.removeEventListener('triggerSampleData', handleSampleDataEvent as EventListener);
    };
  }, []);

  // Handle participant selection
  const handleParticipantSelect = (participant: Participant | null) => {
    setSelectedParticipant(participant);
    if (participant) {
      const updatedFormData = {
        ...formData,
        participant_id: participant._id,
        participant_name: `${participant.first_name} ${participant.last_name}`,
      };
      setFormData(updatedFormData);
      // Clear participant errors when valid selection is made
      setErrors(prev => ({ ...prev, participant_name: undefined }));
    } else {
      setFormData(prev => ({
        ...prev,
        participant_id: undefined,
        participant_name: '',
      }));
    }
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof FormData, value: string) => {
    if (field === 'event_date_time') {
      console.log('🔍 DEBUG: User changed date/time field:');
      console.log('   New value:', value);
      console.log('   Type:', typeof value);
      console.log('   Parsed as Date:', new Date(value));
      console.log('   Date toString():', new Date(value).toString());
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors for the field being edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.reporter_name.trim()) {
      newErrors.reporter_name = 'Reporter name is required';
    }

    if (!formData.participant_name.trim()) {
      newErrors.participant_name = 'Please select a participant';
    }

    if (!formData.event_date_time) {
      newErrors.event_date_time = 'Event date and time is required';
    } else {
      // Validate date is not too far in future or past
      const eventDate = new Date(formData.event_date_time);
      const now = new Date();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (eventDate > new Date(now.getTime() + dayInMs)) {
        newErrors.event_date_time = 'Event date cannot be more than 24 hours in the future';
      } else if (eventDate < new Date(now.getTime() - 30 * dayInMs)) {
        newErrors.event_date_time = 'Event date cannot be more than 30 days in the past';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionToken = localStorage.getItem('auth_session_token');
      if (!sessionToken) {
        throw new Error('No session token found');
      }

      let incidentId = currentIncidentId;

      // Prepare the form data for submission
      const incidentData = {
        sessionToken,
        reporter_name: formData.reporter_name.trim(),
        participant_id: formData.participant_id,
        participant_name: formData.participant_name.trim(),
        event_date_time: formData.event_date_time,
        location: formData.location.trim(),
      };

      // If we have an existing incident, update it; otherwise create a new one
      if (incidentId) {
        console.log('🔍 DEBUG: Updating existing incident with date/time data:');
        console.log('   Incident ID:', incidentId);
        console.log('   Form event_date_time value:', formData.event_date_time);
        console.log('   Type:', typeof formData.event_date_time);
        console.log('   Parsed as Date:', new Date(formData.event_date_time));
        console.log('   Date toString():', new Date(formData.event_date_time).toString());
        console.log('   Date toISOString():', new Date(formData.event_date_time).toISOString());
        console.log('   Full update data being sent:', { ...incidentData, incidentId });
        
        await updateIncidentMetadata({
          ...incidentData,
          incidentId
        });
      } else {
        console.log('🔍 DEBUG: Creating new incident with date/time data:');
        console.log('   Form event_date_time value:', formData.event_date_time);
        console.log('   Type:', typeof formData.event_date_time);
        console.log('   Parsed as Date:', new Date(formData.event_date_time));
        console.log('   Date toString():', new Date(formData.event_date_time).toString());
        console.log('   Date toISOString():', new Date(formData.event_date_time).toISOString());
        console.log('   Full incident data being sent:', incidentData);
        
        incidentId = await createIncident(incidentData);

        // Store the incident ID for future use
        setCurrentIncidentId(incidentId);
      }

      // Proceed to next step
      onComplete(incidentId);
    } catch (error) {
      console.error('Failed to create incident:', error);
      setErrors({ 
        reporter_name: error instanceof Error ? error.message : 'Failed to create incident' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid for submit button state
  const isFormValid = formData.reporter_name.trim() && 
                     formData.participant_name.trim() && 
                     formData.event_date_time && 
                     formData.location.trim();

  return (
    <Card className={cn(
      "w-full mx-auto",
      viewport.isMobile 
        ? "max-w-none border-0 shadow-none" 
        : "max-w-6xl"
    )}>
      <CardHeader className={cn(
        viewport.isMobile ? "p-4 pb-2" : ""
      )}>
        <CardTitle className={cn(
          "flex items-center",
          viewport.isMobile 
            ? "flex-col space-y-1 text-center" 
            : "justify-between"
        )}>
          <div className={cn(
            "flex items-center gap-2",
            viewport.isMobile ? "flex-col space-y-1" : ""
          )}>
            <span className={cn(
              "text-healthcare-primary",
              viewport.isMobile ? "text-lg" : ""
            )}>
              📋 Step 1: Incident Details
            </span>
            <span className={cn(
              "text-sm font-normal text-gray-500",
              viewport.isMobile ? "text-xs" : ""
            )}>
              (Required Information)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(
        viewport.isMobile ? "p-4 pt-0" : ""
      )}>
        {/* Sample Data Error Alert */}
        {sampleDataError && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">
              <div className="flex items-start gap-3">
                <span className="text-orange-600">⚠️</span>
                <div className="flex-1">
                  <p className="font-medium mb-2">Sample Data Generation Failed</p>
                  <p className="text-sm mb-3">{sampleDataError}</p>
                  <div className="text-sm">
                    <strong>Quick Fix:</strong> Go to{' '}
                    <a 
                      href="/participants" 
                      className="text-orange-700 underline hover:text-orange-900"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Participants page
                    </a>{' '}
                    → Click &quot;Sample Data&quot; button → Return here and try again.
                  </div>
                </div>
                <button
                  onClick={() => setSampleDataError(null)}
                  className="text-orange-600 hover:text-orange-800 ml-2"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className={cn(
          viewport.isMobile ? "space-y-5" : "space-y-6"
        )}>
          {/* Reporter Name */}
          <div className="space-y-2">
            <Label htmlFor="reporter_name" className={cn(
              "text-sm font-medium",
              viewport.isMobile ? "text-base" : ""
            )}>
              Reporter Name
            </Label>
            <Input
              id="reporter_name"
              type="text"
              inputMode="text"
              autoComplete="name"
              value={formData.reporter_name}
              onChange={(e) => handleFieldChange('reporter_name', e.target.value)}
              placeholder="Enter reporter name"
              className={cn(
                errors.reporter_name ? 'border-red-500' : '',
                viewport.isMobile ? 'h-12 text-base' : ''
              )}
            />
            <p className={cn(
              "text-xs text-gray-500",
              viewport.isMobile ? "text-sm" : ""
            )}>
              Pre-filled from your account. Edit if reporting on behalf of someone else.
            </p>
            {errors.reporter_name && (
              <Alert>
                <AlertDescription className="text-red-600">
                  {errors.reporter_name}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Participant Selection */}
          <div className="space-y-2">
            <ParticipantSelector
              onSelect={handleParticipantSelect}
              selectedParticipant={selectedParticipant}
              placeholder="Search and select NDIS participant..."
              required
              errorMessage={errors.participant_name}
            />
            <p className="text-xs text-gray-500">
              Select the NDIS participant involved in this incident.
            </p>
            {errors.participant_name && (
              <Alert>
                <AlertDescription className="text-red-600">
                  {errors.participant_name}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Event Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="event_date_time" className={cn(
              "text-sm font-medium",
              viewport.isMobile ? "text-base" : ""
            )}>
              Event Date & Time <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event_date_time"
              type="datetime-local"
              inputMode="none" // Prevents custom keyboard on mobile for date picker
              value={formData.event_date_time}
              onChange={(e) => handleFieldChange('event_date_time', e.target.value)}
              className={cn(
                errors.event_date_time ? 'border-red-500' : '',
                viewport.isMobile ? 'h-12 text-base' : ''
              )}
            />
            <p className={cn(
              "text-xs text-gray-500",
              viewport.isMobile ? "text-sm" : ""
            )}>
              When did the incident occur? Defaults to current date and time.
            </p>
            {errors.event_date_time && (
              <Alert>
                <AlertDescription className="text-red-600">
                  {errors.event_date_time}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className={cn(
              "text-sm font-medium",
              viewport.isMobile ? "text-base" : ""
            )}>
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              type="text"
              inputMode="text"
              autoComplete="off"
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="Where did the incident occur?"
              className={cn(
                errors.location ? 'border-red-500' : '',
                viewport.isMobile ? 'h-12 text-base' : ''
              )}
            />
            <p className={cn(
              "text-xs text-gray-500",
              viewport.isMobile ? "text-sm" : ""
            )}>
              Specific location where the incident took place (e.g., &quot;Main activity room&quot;, &quot;Client&apos;s home&quot;).
            </p>
            {errors.location && (
              <Alert>
                <AlertDescription className="text-red-600">
                  {errors.location}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Form Actions */}
          <div className={cn(
            "flex items-center pt-6 border-t",
            viewport.isMobile 
              ? "flex-col space-y-3" 
              : "justify-between"
          )}>
            {/* Empty div for consistent spacing since there's no Previous on Step 1 - hide on mobile */}
            {!viewport.isMobile && <div></div>}
            
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={cn(
                "bg-ss-teal text-white",
                viewport.isMobile ? "w-full h-12 text-base" : ""
              )}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                'Continue to Narrative →'
              )}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}