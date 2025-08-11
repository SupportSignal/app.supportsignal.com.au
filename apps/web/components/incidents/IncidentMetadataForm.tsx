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
import { ParticipantSelector } from '@/components/participants/ParticipantSelector';
import { SampleDataButton } from './SampleDataButton';
import { Id } from '@/convex/_generated/dataModel';
import { Participant } from '@/types/participants';

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
  const [formData, setFormData] = useState<FormData>({
    reporter_name: user.name, // Pre-fill from authenticated user
    participant_id: undefined,
    participant_name: '',
    event_date_time: new Date().toISOString().slice(0, 16), // Current date/time in local format
    location: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [currentIncidentId, setCurrentIncidentId] = useState<Id<"incidents"> | null>(existingIncidentId || null);



  const createIncident = useMutation(api.incidents.create);
  const generateRandomData = useMutation(api.incidents.createSampleData.generateRandomIncidentMetadata);

  // Load existing incident data if editing
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('auth_session_token') : null;
  const existingIncident = useQuery(
    api.incidents.getDraftIncident,
    existingIncidentId && sessionToken ? { sessionToken, incidentId: existingIncidentId } : 'skip'
  );


  // Load existing incident data into form when available
  useEffect(() => {
    if (existingIncident?.incident) {
      const incident = existingIncident.incident;
      
      const newFormData = {
        reporter_name: incident.reporter_name || user.name,
        participant_id: incident.participant_id,
        participant_name: incident.participant_name || '',
        event_date_time: incident.event_date_time || new Date().toISOString().slice(0, 16),
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
    }
  }, [existingIncident, user.name]);


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
      // Could add user-facing error handling here
    }
  };

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

      // If we have an existing incident, use it; otherwise create a new one
      if (!incidentId) {
        const incidentData = {
          sessionToken,
          reporter_name: formData.reporter_name.trim(),
          participant_id: formData.participant_id,
          participant_name: formData.participant_name.trim(),
          event_date_time: formData.event_date_time,
          location: formData.location.trim(),
        };
        
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            📋 Step 1: Incident Details
            <span className="text-sm font-normal text-gray-500">
              (Required Information)
            </span>
          </div>
          <Button 
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-white hover:bg-ss-teal border-b border-dashed border-gray-300 rounded-none hover:border-ss-teal transition-all duration-200"
            onClick={handleRandomSample}
          >
            Random Sample
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporter Name */}
          <div className="space-y-2">
            <Label htmlFor="reporter_name" className="text-sm font-medium">
              Reporter Name
            </Label>
            <Input
              id="reporter_name"
              type="text"
              value={formData.reporter_name}
              onChange={(e) => handleFieldChange('reporter_name', e.target.value)}
              placeholder="Enter reporter name"
              className={errors.reporter_name ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
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
            <Label htmlFor="event_date_time" className="text-sm font-medium">
              Event Date & Time <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event_date_time"
              type="datetime-local"
              value={formData.event_date_time}
              onChange={(e) => handleFieldChange('event_date_time', e.target.value)}
              className={errors.event_date_time ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
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
            <Label htmlFor="location" className="text-sm font-medium">
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="Where did the incident occur?"
              className={errors.location ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
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
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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

          {/* Progress Indicator */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Step 1 of 7</span>
              <div className="flex space-x-1">
                <div className="w-8 h-1 bg-blue-600 rounded"></div>
                <div className="w-8 h-1 bg-gray-300 rounded"></div>
                <div className="w-8 h-1 bg-gray-300 rounded"></div>
                <div className="w-8 h-1 bg-gray-300 rounded"></div>
                <div className="w-8 h-1 bg-gray-300 rounded"></div>
                <div className="w-8 h-1 bg-gray-300 rounded"></div>
                <div className="w-8 h-1 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}