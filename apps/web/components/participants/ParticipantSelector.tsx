// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent } from '@starter/ui/card';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Badge } from '@starter/ui/badge';
import { 
  Participant,
  ParticipantOption,
  SUPPORT_LEVELS,
  PARTICIPANT_STATUS 
} from '@/types/participants';
import { Id } from 'convex/_generated/dataModel';

interface ParticipantSelectorProps {
  onSelect: (participant: Participant | null) => void;
  selectedParticipantId?: Id<"participants"> | null;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  errorMessage?: string;
}

/**
 * Searchable dropdown component for participant selection in incident metadata
 * Designed for Epic 3 incident capture workflow integration
 * Implements AC4: Participant selection component for incident reports
 */
export function ParticipantSelector({ 
  onSelect,
  selectedParticipantId,
  placeholder = "Select NDIS participant...",
  required = false,
  disabled = false,
  className = '',
  errorMessage
}: ParticipantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Get session token for authenticated queries
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
  
  // Fetch active participants only
  const participants = useQuery(
    api.participants.list.listParticipants,
    sessionToken ? {
      sessionToken,
      search: searchQuery || undefined,
      status: 'active', // Only show active participants for incident selection
      limit: 100, // Reasonable limit for dropdown
    } : 'skip'
  );

  // Get selected participant details if we have an ID but no participant object
  const selectedParticipantData = useQuery(
    api.participants.getById.getParticipantById,
    sessionToken && selectedParticipantId && !selectedParticipant ? {
      sessionToken,
      participantId: selectedParticipantId,
    } : 'skip'
  );

  // Update selected participant when data is available
  useEffect(() => {
    if (selectedParticipantData?.participant && !selectedParticipant) {
      setSelectedParticipant(selectedParticipantData.participant);
    }
  }, [selectedParticipantData, selectedParticipant]);

  // Clear selection when selectedParticipantId is null
  useEffect(() => {
    if (selectedParticipantId === null) {
      setSelectedParticipant(null);
      setSearchQuery('');
    }
  }, [selectedParticipantId]);

  const handleParticipantSelect = (participant: Participant) => {
    setSelectedParticipant(participant);
    setSearchQuery('');
    setIsOpen(false);
    onSelect(participant);
  };

  const handleClear = () => {
    setSelectedParticipant(null);
    setSearchQuery('');
    onSelect(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const filteredParticipants = participants?.participants || [];
  
  // Format participant display label
  const formatParticipantLabel = (participant: Participant): string => {
    return `${participant.first_name} ${participant.last_name} (${participant.ndis_number})`;
  };

  return (
    <div className={`relative ${className}`}>
      <Label className="block text-sm font-medium mb-2">
        NDIS Participant {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        {/* Selected Participant Display */}
        {selectedParticipant ? (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {selectedParticipant.first_name} {selectedParticipant.last_name}
                    </span>
                    <Badge 
                      variant="outline"
                      className={`
                        text-xs
                        ${SUPPORT_LEVELS[selectedParticipant.support_level].color === 'red' ? 'border-red-300 text-red-700' : ''}
                        ${SUPPORT_LEVELS[selectedParticipant.support_level].color === 'orange' ? 'border-orange-300 text-orange-700' : ''}
                        ${SUPPORT_LEVELS[selectedParticipant.support_level].color === 'green' ? 'border-green-300 text-green-700' : ''}
                      `}
                    >
                      {SUPPORT_LEVELS[selectedParticipant.support_level].label}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>NDIS: {selectedParticipant.ndis_number}</div>
                    {selectedParticipant.contact_phone && (
                      <div>Phone: {selectedParticipant.contact_phone}</div>
                    )}
                    {selectedParticipant.care_notes && (
                      <div className="italic text-gray-500">
                        Care Notes: {selectedParticipant.care_notes.substring(0, 100)}
                        {selectedParticipant.care_notes.length > 100 && '...'}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={disabled}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear selection"
                >
                  ✕
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Search Input */
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className={`
                ${errorMessage ? 'border-red-500' : ''}
                ${isOpen ? 'rounded-b-none' : ''}
              `}
            />
            
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-400">
                {isOpen ? '▲' : '▼'}
              </span>
            </div>
          </div>
        )}
        
        {/* Dropdown Results */}
        {isOpen && !selectedParticipant && (
          <div className="absolute z-10 w-full bg-white border border-t-0 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
            {!sessionToken ? (
              <div className="p-4 text-center text-gray-500">
                Please sign in to select participants
              </div>
            ) : participants === undefined ? (
              <div className="p-4 text-center text-gray-500">
                Loading participants...
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? `No participants found matching "${searchQuery}"` : 'No active participants found'}
              </div>
            ) : (
              filteredParticipants.map((participant) => (
                <button
                  key={participant._id}
                  type="button"
                  onClick={() => handleParticipantSelect(participant)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 focus:bg-blue-50 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {participant.first_name} {participant.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        NDIS: {participant.ndis_number} • {SUPPORT_LEVELS[participant.support_level].label} Support
                      </div>
                      {participant.contact_phone && (
                        <div className="text-xs text-gray-500">
                          Phone: {participant.contact_phone}
                        </div>
                      )}
                    </div>
                    
                    <Badge 
                      variant="outline"
                      className={`
                        text-xs ml-2
                        ${SUPPORT_LEVELS[participant.support_level].color === 'red' ? 'border-red-300 text-red-700' : ''}
                        ${SUPPORT_LEVELS[participant.support_level].color === 'orange' ? 'border-orange-300 text-orange-700' : ''}
                        ${SUPPORT_LEVELS[participant.support_level].color === 'green' ? 'border-green-300 text-green-700' : ''}
                      `}
                    >
                      {SUPPORT_LEVELS[participant.support_level].label}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {errorMessage && (
        <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
      )}
      
      {/* Helper Text */}
      {!errorMessage && (
        <p className="text-xs text-gray-500 mt-1">
          Start typing to search for participants by name or NDIS number
        </p>
      )}
      
      {/* Click outside handler */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}