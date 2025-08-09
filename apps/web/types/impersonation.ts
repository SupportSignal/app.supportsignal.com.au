import { Id } from '@/convex/_generated/dataModel';

// Type for impersonation session document
export type ImpersonationSessionDoc = {
  _id: Id<'impersonation_sessions'>;
  _creationTime: number;
  admin_user_id: Id<'users'>;
  target_user_id: Id<'users'>;
  session_token: string;
  original_session_token: string;
  reason: string;
  expires: number;
  is_active: boolean;
  created_at: number;
  terminated_at?: number;
  correlation_id: string;
};

export interface ImpersonationSession extends ImpersonationSessionDoc {}

export interface ImpersonationStatus {
  isImpersonating: boolean;
  adminUser?: {
    id: Id<'users'>;
    name: string;
    email: string;
  };
  targetUser?: {
    id: Id<'users'>;
    name: string;
    email: string;
    role: string;
  };
  sessionToken?: string;
  timeRemaining?: number; // milliseconds until expiry
  correlation_id?: string;
}

export interface StartImpersonationRequest {
  admin_session_token: string;
  target_user_email: string;
  reason: string;
}

export interface StartImpersonationResponse {
  success: boolean;
  impersonation_token?: string;
  correlation_id?: string;
  expires?: number;
  error?: string;
}

export interface EndImpersonationRequest {
  impersonation_token: string;
}

export interface EndImpersonationResponse {
  success: boolean;
  original_session_token?: string;
  error?: string;
}

export interface ImpersonationSearchResult {
  id: Id<'users'>;
  name: string;
  email: string;
  role: string;
  company_name?: string;
}

export interface ImpersonationAuditEvent {
  action: 'start' | 'end' | 'timeout' | 'emergency_terminate';
  admin_user_id: Id<'users'>;
  target_user_id: Id<'users'>;
  correlation_id: string;
  timestamp: number;
  reason?: string;
  session_duration?: number;
}

export const IMPERSONATION_CONFIG = {
  SESSION_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  MAX_CONCURRENT_SESSIONS: 3,
  TOKEN_LENGTH: 32,
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
} as const;