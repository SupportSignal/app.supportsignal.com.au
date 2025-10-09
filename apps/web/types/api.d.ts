/**
 * SupportSignal API Type Definitions
 * 
 * Frontend-ready TypeScript definitions for all SupportSignal APIs
 * Generated for Story 1.5 - API Documentation & Frontend Handoff
 * 
 * Import these types in your React components for full type safety:
 * import { UserProfile, Incident, IncidentNarrative } from '@/types/api';
 */

import { Id } from '../../convex/_generated/dataModel';

// ============================================================================
// AUTHENTICATION & USER TYPES
// ============================================================================

export interface UserProfile {
  _id: Id<"users">;
  _creationTime: number;
  
  // Basic profile information
  name: string;
  email: string;
  profile_image_url?: string;
  
  // Role-based access control
  role: "system_admin" | "demo_admin" | "company_admin" | "team_lead" | "frontline_worker";
  
  // Company context
  company_id: Id<"companies">;
}

export type UserRole = UserProfile['role'];

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken: string | null;
}

// ============================================================================
// INCIDENT MANAGEMENT TYPES
// ============================================================================

export interface Incident {
  _id: Id<"incidents">;
  _creationTime: number;
  
  // Company context
  company_id: Id<"companies">;
  
  // Basic incident information
  reporter_name: string;
  participant_name: string;
  event_date_time: string; // ISO date string
  location: string;
  
  // Workflow status
  capture_status: "draft" | "in_progress" | "completed";
  analysis_status: "not_started" | "in_progress" | "completed";
  overall_status: "capture_pending" | "analysis_pending" | "completed";
  
  // Audit fields
  created_at: number;
  created_by: Id<"users">;
  updated_at: number;
  
  // Data quality tracking
  narrative_hash?: string;
  questions_generated: boolean;
  narrative_enhanced: boolean;
  analysis_generated: boolean;
}

export type CaptureStatus = Incident['capture_status'];
export type AnalysisStatus = Incident['analysis_status'];
export type OverallStatus = Incident['overall_status'];

export interface IncidentSubscription {
  incident: Incident;
  narrative: IncidentNarrative | null;
  analysis: IncidentAnalysis | null;
  classifications: IncidentClassification[];
  subscribedAt: number;
  correlationId: string;
}

export interface IncidentListSubscription {
  incidents: Incident[];
  subscribedAt: number;
  totalCount: number;
  correlationId: string;
}

// ============================================================================
// NARRATIVE MANAGEMENT TYPES
// ============================================================================

export interface IncidentNarrative {
  _id: Id<"incident_narratives">;
  _creationTime: number;
  
  incident_id: Id<"incidents">;
  
  // Four-phase narrative structure
  before_event: string;
  during_event: string;
  end_event: string;
  post_event: string;
  
  // AI-enhanced content (optional)
  before_event_extra?: string;
  during_event_extra?: string;
  end_event_extra?: string;
  post_event_extra?: string;
  
  // Auto-generated consolidated narrative
  consolidated_narrative?: string;
  
  // Metadata
  created_at: number;
  updated_at: number;
  enhanced_at?: number;
  version: number;
}

export interface ConsolidatedNarrative extends IncidentNarrative {
  consolidated_narrative: string; // Always present, auto-generated
}

export type NarrativePhase = 'before_event' | 'during_event' | 'end_event' | 'post_event';

export interface NarrativeSubscription {
  incident_id: Id<"incidents">;
  narrative: ConsolidatedNarrative | null;
  subscribedAt: number;
  correlationId: string;
}

export interface NarrativeActivitySubscription {
  incident_id: Id<"incidents">;
  activity: {
    activeEditors: Array<{userId: Id<"users">, section: string}>;
    recentUpdates: Array<{
      userId: Id<"users">, 
      section: string, 
      lastUpdate: number, 
      action: string
    }>;
    editLocks: string[]; // Sections currently being edited
  };
  subscribedAt: number;
  correlationId: string;
}

// ============================================================================
// SESSION MANAGEMENT TYPES
// ============================================================================

export type WorkflowType = "incident_capture" | "incident_analysis" | "user_registration" | "chat_session";

export interface WorkflowData {
  incidentId?: Id<"incidents">;
  currentStep?: string;
  completedSteps?: string[];
  formData?: Record<string, unknown>;
  lastActivity?: number;
  metadata?: Record<string, unknown>;
  
  // Auto-added by system
  sessionId?: Id<"sessions">;
  userId?: Id<"users">;
}

export interface WorkflowState {
  workflowType: WorkflowType;
  workflowData: WorkflowData;
  sessionId: Id<"sessions">;
  userId: Id<"users">;
  lastActivity: number;
  created: number;
}

export interface SessionValidation {
  valid: boolean;
  reason?: string;
  user?: {
    id: Id<"users">;
    name: string;
    email: string;
    role: string;
    company_id: Id<"companies">;
  };
  session?: {
    expires: number;
    rememberMe: boolean;
    shouldRefresh: boolean;
  };
  workflowState?: WorkflowState;
  correlationId: string;
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

export interface IncidentAnalysis {
  _id: Id<"incident_analysis">;
  _creationTime: number;
  
  incident_id: Id<"incidents">;
  
  // Analysis content
  analysis_summary: string;
  root_cause_analysis?: string;
  recommendations?: string;
  
  // AI metadata
  ai_model?: string;
  ai_prompt_version?: string;
  confidence_score?: number;
  
  // Timestamps
  created_at: number;
  updated_at: number;
  generated_by: Id<"users">;
}

export interface IncidentClassification {
  _id: Id<"incident_classifications">;
  _creationTime: number;
  
  analysis_id: Id<"incident_analysis">;
  
  classification_type: string;
  classification_value: string;
  confidence_score?: number;
  
  created_at: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Incident Management API Types
export interface CreateIncidentArgs {
  sessionToken: string;
  reporter_name: string;
  participant_name: string;
  event_date_time: string;
  location: string;
}

export interface GetIncidentArgs {
  sessionToken: string;
  id: Id<"incidents">;
}

export interface ListIncidentsArgs {
  sessionToken: string;
  overallStatus?: OverallStatus;
  limit?: number;
}

export interface UpdateIncidentStatusArgs {
  sessionToken: string;
  id: Id<"incidents">;
  capture_status?: CaptureStatus;
  analysis_status?: AnalysisStatus;
}

// Narrative Management API Types
export interface CreateNarrativeArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
}

export interface UpdateNarrativeArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
  before_event?: string;
  during_event?: string;
  end_event?: string;
  post_event?: string;
}

export interface EnhanceNarrativeArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
  enhanced_before?: string;
  enhanced_during?: string;
  enhanced_end?: string;
  enhanced_post?: string;
}

export interface GetNarrativeArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
}

// User Management API Types
export interface GetCurrentUserArgs {
  sessionToken: string;
}

export interface UpdateUserProfileArgs {
  sessionToken: string;
  name?: string;
  profile_image_url?: string;
}

// Session Management API Types
export interface UpdateWorkflowStateArgs {
  sessionToken: string;
  workflowType: WorkflowType;
  workflowData: WorkflowData;
  saveToSession?: boolean;
}

export interface RecoverWorkflowStateArgs {
  sessionToken: string;
  workflowType?: WorkflowType;
}

export interface ValidateSessionArgs {
  sessionToken: string;
  includeWorkflowState?: boolean;
}

export interface RefreshSessionArgs {
  sessionToken: string;
  extendExpiry?: boolean;
}

export interface InvalidateSessionArgs {
  sessionToken: string;
  reason?: string;
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface PermissionContext {
  companyId?: Id<"companies">;
  resourceOwnerId?: Id<"users">;
}

export type Permission = 
  | 'CREATE_INCIDENT'
  | 'EDIT_OWN_INCIDENT_CAPTURE'
  | 'VIEW_ALL_COMPANY_INCIDENTS'
  | 'PERFORM_ANALYSIS'
  | 'USER_MANAGEMENT'
  | 'COMPANY_CONFIGURATION';

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ValidationError extends Error {
  name: 'ValidationError';
  message: string;
  errorType: string;
  context?: Record<string, unknown>;
}

export interface AuthenticationError extends Error {
  name: 'AuthenticationError';
  message: string;
  reason: string;
}

export interface AuthorizationError extends Error {
  name: 'AuthorizationError';
  message: string;
  requiredPermission: string;
}

// ============================================================================
// REACT HOOK TYPES
// ============================================================================

export interface UseAuthReturn extends AuthState {
  login: (sessionToken: string) => void;
  logout: () => void;
  refreshAuth: () => void;
}

export interface UseSimpleAuthReturn {
  isLoggedIn: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  login: (sessionToken: string) => void;
  logout: () => void;
  
  // Simplified role checking for MVP
  isAdmin: boolean;
  canAnalyze: boolean;
  canAccessAI: boolean;
  
  // Simplified permissions
  canCreateIncidents: boolean;
  canEditOwnIncidents: boolean;
  canViewAllIncidents: boolean;
}

export interface UsePermissionsReturn {
  hasPermission: (permission: Permission) => boolean;
  canEditIncident: (incident: Pick<Incident, 'created_by'>) => boolean;
  canViewIncident: (incident: Pick<Incident, 'created_by' | 'company_id'>) => boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  cursor?: string;
  totalCount?: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface IncidentFormData {
  reporter_name: string;
  participant_name: string;
  event_date_time: string;
  location: string;
}

export interface NarrativeFormData {
  before_event: string;
  during_event: string;
  end_event: string;
  post_event: string;
}

export interface UserProfileFormData {
  name: string;
  profile_image_url: string;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface IncidentCardProps {
  incident: Incident;
  onEdit?: (incidentId: Id<"incidents">) => void;
  onView?: (incidentId: Id<"incidents">) => void;
  onDelete?: (incidentId: Id<"incidents">) => void;
  showActions?: boolean;
}

export interface NarrativeEditorProps {
  incidentId: Id<"incidents">;
  readonly?: boolean;
  onSave?: (data: Partial<NarrativeFormData>) => void;
  onPhaseComplete?: (phase: NarrativePhase) => void;
}

export interface WorkflowStepProps {
  step: string;
  isActive: boolean;
  isCompleted: boolean;
  data?: Record<string, unknown>;
  onComplete?: (stepData: Record<string, unknown>) => void;
  onBack?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  COMPANY_ADMIN: 'company_admin', 
  TEAM_LEAD: 'team_lead',
  FRONTLINE_WORKER: 'frontline_worker'
} as const;

export const INCIDENT_STATUS = {
  // Capture Status
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  
  // Analysis Status  
  NOT_STARTED: 'not_started',
  // IN_PROGRESS: 'in_progress', // Shared with capture
  // COMPLETED: 'completed', // Shared with capture
  
  // Overall Status
  CAPTURE_PENDING: 'capture_pending',
  ANALYSIS_PENDING: 'analysis_pending',
  // COMPLETED: 'completed' // Shared with others
} as const;

export const NARRATIVE_PHASES = {
  BEFORE_EVENT: 'before_event',
  DURING_EVENT: 'during_event', 
  END_EVENT: 'end_event',
  POST_EVENT: 'post_event'
} as const;

export const WORKFLOW_TYPES = {
  INCIDENT_CAPTURE: 'incident_capture',
  INCIDENT_ANALYSIS: 'incident_analysis',
  USER_REGISTRATION: 'user_registration',
  CHAT_SESSION: 'chat_session'
} as const;

export const PERMISSIONS = {
  CREATE_INCIDENT: 'CREATE_INCIDENT',
  EDIT_OWN_INCIDENT_CAPTURE: 'EDIT_OWN_INCIDENT_CAPTURE',
  VIEW_ALL_COMPANY_INCIDENTS: 'VIEW_ALL_COMPANY_INCIDENTS',
  PERFORM_ANALYSIS: 'PERFORM_ANALYSIS',
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  COMPANY_CONFIGURATION: 'COMPANY_CONFIGURATION'
} as const;