import { Id } from 'convex/_generated/dataModel';

/**
 * NDIS Participant types for the SupportSignal application
 * Matches the database schema defined in apps/convex/schema.ts
 */

export interface Participant {
  _id: Id<"participants">;
  company_id: Id<"companies">;
  
  // Core participant information
  first_name: string;
  last_name: string;
  date_of_birth: string;
  ndis_number: string;
  
  // Contact information
  contact_phone?: string;
  emergency_contact?: string;
  
  // Service information
  support_level: "high" | "medium" | "low";
  care_notes?: string;
  
  // Status
  status: "active" | "inactive" | "discharged";
  
  // Audit trail
  created_at: number;
  created_by: Id<"users">;
  updated_at: number;
  updated_by: Id<"users">;
}

export interface CreateParticipantRequest {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  ndis_number: string;
  contact_phone?: string;
  emergency_contact?: string;
  support_level: "high" | "medium" | "low";
  care_notes?: string;
}

export interface UpdateParticipantRequest {
  participantId: Id<"participants">;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  ndis_number?: string;
  contact_phone?: string;
  emergency_contact?: string;
  support_level?: "high" | "medium" | "low";
  care_notes?: string;
}

export interface ParticipantListFilters {
  search?: string;
  status?: string;
  support_level?: string;
  limit?: number;
}

export interface ParticipantSearchFilters extends ParticipantListFilters {
  age_range?: {
    min_age?: number;
    max_age?: number;
  };
  sort_by?: "name" | "ndis_number" | "created_date" | "updated_date";
  sort_order?: "asc" | "desc";
  offset?: number;
}

export interface ParticipantFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  ndis_number: string;
  contact_phone: string;
  emergency_contact: string;
  support_level: "high" | "medium" | "low";
  care_notes: string;
}

export interface ParticipantValidationErrors {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  ndis_number?: string;
  contact_phone?: string;
  emergency_contact?: string;
  support_level?: string;
  care_notes?: string;
}

// For Epic 3 integration - participant selection in incident capture
export interface ParticipantOption {
  value: Id<"participants">;
  label: string;
  participant: Participant;
}

// Support level display configurations
export const SUPPORT_LEVELS = {
  high: {
    value: 'high' as const,
    label: 'High Support',
    description: 'Requires intensive support and frequent monitoring',
    color: 'red',
    priority: 3,
  },
  medium: {
    value: 'medium' as const,
    label: 'Medium Support',
    description: 'Requires regular support with some independence',
    color: 'orange',
    priority: 2,
  },
  low: {
    value: 'low' as const,
    label: 'Low Support',
    description: 'Requires minimal support with high independence',
    color: 'green',
    priority: 1,
  },
} as const;

// Participant status display configurations
export const PARTICIPANT_STATUS = {
  active: {
    value: 'active' as const,
    label: 'Active',
    description: 'Currently receiving services',
    color: 'green',
    icon: '✓',
  },
  inactive: {
    value: 'inactive' as const,
    label: 'Inactive',
    description: 'Temporarily not receiving services',
    color: 'orange',
    icon: '⏸',
  },
  discharged: {
    value: 'discharged' as const,
    label: 'Discharged',
    description: 'No longer receiving services',
    color: 'red',
    icon: '✕',
  },
} as const;

// Helper type for form validation
export type ParticipantFormField = keyof ParticipantFormData;

// Helper function types
export type ParticipantSortField = "name" | "ndis_number" | "created_date" | "updated_date";
export type ParticipantSortOrder = "asc" | "desc";

// Age calculation utility type
export interface ParticipantAge {
  years: number;
  months: number;
  isValid: boolean;
}

// Company information for participants
export interface ParticipantCompany {
  _id: Id<"companies">;
  name: string;
  slug: string;
}

// Response type for participant list with company info
export interface ParticipantListResponse {
  participants: Participant[];
  company: ParticipantCompany;
  totalCount: number;
  correlationId: string;
}