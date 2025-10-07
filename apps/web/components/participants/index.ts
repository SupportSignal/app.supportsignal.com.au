/**
 * NDIS Participants Management Components
 * 
 * Comprehensive participant management system for SupportSignal application
 * Implements Story 2.3 requirements for NDIS participant management
 */

export { ParticipantForm } from './participant-form';
export { ParticipantList } from './participant-list';
export { ParticipantCard } from './participant-card';
export { ParticipantSearch } from './participant-search';
export { ParticipantSelector } from './participant-selector';

// Re-export types for convenience
export type {
  Participant,
  CreateParticipantRequest,
  UpdateParticipantRequest,
  ParticipantFormData,
  ParticipantListFilters,
  ParticipantSearchFilters,
  ParticipantOption,
  ParticipantValidationErrors,
} from '@/types/participants';

export {
  SUPPORT_LEVELS,
  PARTICIPANT_STATUS,
} from '@/types/participants';