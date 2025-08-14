/**
 * TypeScript interfaces for complete workflow data export/import
 * Used by DeveloperToolsBar for workflow state management
 */

import { Id } from '@/convex/_generated/dataModel';

export interface WorkflowMetadata {
  incident_id: Id<"incidents">;
  created_at: number;
  reporter_name: string;
  participant_name: string;
  participant_id: Id<"participants">;
  event_date_time: string;
  location: string;
  company_id: Id<"companies">;
  created_by: Id<"users">;
  export_timestamp: number;
  export_step: number;
  capture_status: string;
  overall_status: string;
}

export interface WorkflowParticipantDetails {
  first_name: string;
  last_name: string;
  ndis_number: string;
  date_of_birth: string;
  care_notes?: string;
  support_level: "high" | "medium" | "low";
  contact_phone?: string;
  emergency_contact?: string;
}

export interface WorkflowNarrativeData {
  before_event: string;
  during_event: string;
  end_event: string;
  post_event: string;
  before_event_extra?: string;
  during_event_extra?: string;
  end_event_extra?: string;
  post_event_extra?: string;
  consolidated_narrative?: string;
  version: number;
  created_at: number;
  updated_at: number;
}

export interface WorkflowQuestion {
  question_id: string;
  question_text: string;
  question_order: number;
  ai_model: string;
  prompt_version: string;
  generated_at: number;
}

export interface WorkflowAnswer {
  question_id: string;
  answer_text: string;
  character_count: number;
  word_count: number;
  is_complete: boolean;
  answered_at: number;
  answered_by: Id<"users">;
}

export interface WorkflowClarificationPhase {
  phase: "before_event" | "during_event" | "end_event" | "post_event";
  questions: WorkflowQuestion[];
  answers: WorkflowAnswer[];
  phase_complete: boolean;
}

export interface WorkflowEnhancedNarrative {
  enhanced_content: string;
  original_content: string;
  clarification_responses: string;
  ai_model: string;
  enhancement_prompt?: string;
  enhancement_version: number;
  quality_score?: number;
  processing_time_ms: number;
  user_edited: boolean;
  user_edits?: string;
  created_at: number;
  updated_at: number;
}

export interface WorkflowCompletionStatus {
  completed_steps: string[];
  current_step: number;
  total_progress: number;
  questions_generated: boolean;
  narrative_enhanced: boolean;
  analysis_generated: boolean;
  workflow_completed_at?: number;
}

export interface WorkflowExportData {
  version: "1.0"; // Schema version for backward compatibility
  exported_at: number;
  exported_by: Id<"users">;
  
  metadata: WorkflowMetadata;
  participant_details: WorkflowParticipantDetails;
  narrative_data?: WorkflowNarrativeData;
  clarification_workflow: {
    before_event?: WorkflowClarificationPhase;
    during_event?: WorkflowClarificationPhase;
    end_event?: WorkflowClarificationPhase;
    post_event?: WorkflowClarificationPhase;
  };
  enhanced_narrative?: WorkflowEnhancedNarrative;
  completion_status: WorkflowCompletionStatus;
}

export interface WorkflowImportResult {
  success: boolean;
  incident_id?: Id<"incidents">;
  created_step: number;
  errors: string[];
  warnings: string[];
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  detected_step: number; // Highest step that has valid data
}

// Utility type for sample data permissions
export type SampleDataRole = "system_admin" | "demo_admin";

export interface DeveloperToolsBarProps {
  user: {
    role: string;
    sessionToken?: string;
  } | null;
  currentStep: number;
  incidentId: Id<"incidents"> | null;
  onExportComplete?: (filename: string) => void;
  onImportComplete?: (result: WorkflowImportResult) => void;
  onStepNavigate?: (step: number) => void;
}

// Context-aware button states for the tools bar
export interface ToolsBarButtonStates {
  fillForm: boolean;      // Active on Step 1
  fillNarrative: boolean; // Active on Step 2  
  fillQA: boolean;        // Active on Steps 3-6
  exportWorkflow: boolean; // Active when has progress
  importWorkflow: boolean; // Always active
}