/**
 * NDIS Participants Management Components
 * 
 * Comprehensive participant management system for SupportSignal application
 * Implements Story 2.3 requirements for NDIS participant management
 */

export { ParticipantForm } from './ParticipantForm';
export { ParticipantList } from './ParticipantList';
export { ParticipantCard } from './ParticipantCard';
export { ParticipantSearch } from './ParticipantSearch';
export { ParticipantSelector } from './ParticipantSelector';

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