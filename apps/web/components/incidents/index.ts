/**
 * Incident Capture Workflow Components
 * 
 * Implements Story 3.1 & 3.2 requirements for complete incident capture workflow
 * Features metadata collection, multi-phase narrative input, AI clarification, and auto-save functionality
 */

// Main workflow components
export { IncidentCaptureWorkflow } from './IncidentCaptureWorkflow';
export { IncidentMetadataForm } from './IncidentMetadataForm';
export { NarrativeGrid } from './NarrativeGrid';

// AI clarification components (Story 3.2)
export { ClarificationStep } from './ClarificationStep';
export { QuestionsList } from './QuestionsList';
export { QuestionCard } from './QuestionCard';
export { ClarificationProgress } from './ClarificationProgress';