'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { 
  Participant,
  SUPPORT_LEVELS,
  PARTICIPANT_STATUS 
} from '@/types/participants';

interface ParticipantCardProps {
  participant: Participant;
  onEdit?: (participant: Participant) => void;
  onView?: (participant: Participant) => void;
  onStatusChange?: (participant: Participant) => void;
  className?: string;
}

/**
 * Individual participant display card component
 * Implements mobile-responsive design with key participant information
 */
export function ParticipantCard({ 
  participant,
  onEdit,
  onView,
  onStatusChange,
  className = ''
}: ParticipantCardProps) {
  const supportLevel = SUPPORT_LEVELS[participant.support_level];
  const status = PARTICIPANT_STATUS[participant.status];

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): string => {
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) {
        return 'Unknown age';
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return `${age} years old`;
    } catch {
      return 'Unknown age';
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-semibold">
                📋 {participant.first_name} {participant.last_name}
              </span>
              <Badge 
                variant={status.color === 'green' ? 'default' : 'secondary'}
                className={`
                  ${status.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                  ${status.color === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
                  ${status.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                  text-xs
                `}
              >
                {status.icon} {status.label}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <span className="font-medium">NDIS:</span> {participant.ndis_number}
              </div>
              
              <div className="flex flex-wrap gap-4">
                <span>
                  <span className="font-medium">Support:</span>{' '}
                  <Badge 
                    variant="outline"
                    className={`
                      ${supportLevel.color === 'red' ? 'border-red-300 text-red-700' : ''}
                      ${supportLevel.color === 'orange' ? 'border-orange-300 text-orange-700' : ''}
                      ${supportLevel.color === 'green' ? 'border-green-300 text-green-700' : ''}
                      text-xs
                    `}
                  >
                    {supportLevel.label}
                  </Badge>
                </span>
                
                <span>
                  <span className="font-medium">Age:</span> {calculateAge(participant.date_of_birth)}
                </span>
              </div>

              {participant.contact_phone && (
                <div>
                  <span className="font-medium">Phone:</span> {participant.contact_phone}
                </div>
              )}

              {participant.emergency_contact && (
                <div>
                  <span className="font-medium">Emergency:</span> {participant.emergency_contact}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(participant)}
                className="text-xs"
              >
                View
              </Button>
            )}
            
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(participant)}
                className="text-xs"
              >
                Edit
              </Button>
            )}
            
            {onStatusChange && (
              <select
                onChange={(e) => {
                  // This would trigger a status change action
                  // TODO: Implement status change handler
                }}
                className="text-xs border rounded px-2 py-1"
                value={participant.status}
                title="Change status"
              >
                <option value="">Status ▼</option>
                {Object.values(PARTICIPANT_STATUS).map((statusOption) => (
                  <option 
                    key={statusOption.value} 
                    value={statusOption.value}
                    disabled={statusOption.value === participant.status}
                  >
                    {statusOption.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </CardHeader>

      {participant.care_notes && (
        <CardContent className="pt-0">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Care Notes:</span>
              <p className="text-gray-600 mt-1 leading-relaxed">
                {participant.care_notes}
              </p>
            </div>
          </div>
        </CardContent>
      )}

      {/* Footer with metadata */}
      <CardContent className="pt-0 pb-3">
        <div className="text-xs text-gray-400 border-t pt-2 mt-2">
          <div className="flex justify-between">
            <span>DOB: {formatDate(participant.date_of_birth)}</span>
            <span>Updated: {new Date(participant.updated_at).toLocaleDateString('en-AU')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}