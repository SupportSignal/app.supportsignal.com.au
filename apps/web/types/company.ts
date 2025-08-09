import { Id } from '@/convex/_generated/dataModel';

/**
 * Company management types for SupportSignal application
 * Matches the database schema defined in apps/convex/schema.ts
 */

// User interface for company users list
export interface CompanyUser {
  _id: Id<"users">;
  name: string;
  email: string;
  role: "system_admin" | "company_admin" | "team_lead" | "frontline_worker";
  has_llm_access?: boolean;
  profile_image_url?: string;
}

// Core company interface matching Convex schema
export interface Company {
  _id: Id<"companies">;
  name: string;
  contact_email: string;
  status: "active" | "trial" | "suspended";
  created_at: number;
  created_by?: Id<"users">;
  _creationTime: number;
  users?: CompanyUser[];
  userCount?: number;
}

// Company management interface with additional computed fields
export interface CompanyManagement extends Company {
  canEdit: boolean; // Based on user role
  lastUpdated: number;
  updatedBy?: Id<"users">;
}

// Form data for company updates
export interface CompanyUpdateForm {
  name: string;
  contact_email: string;
  status: "active" | "trial" | "suspended";
}

// API response types
export interface CompanyResponse {
  company: Company;
  correlationId: string;
}

export interface CompanyUpdateResponse {
  company: Company;
  correlationId: string;
}

// Status options for form select
export const COMPANY_STATUSES = [
  { value: 'active', label: 'Active', description: 'Company is actively using the system' },
  { value: 'trial', label: 'Trial', description: 'Company is in trial period' },
  { value: 'suspended', label: 'Suspended', description: 'Company access is temporarily suspended' }
] as const;

// Form validation
export interface CompanyFormValidation {
  name: string | null;
  contact_email: string | null;
  status: string | null;
  isValid: boolean;
}