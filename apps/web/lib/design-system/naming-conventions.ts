/**
 * SupportSignal Design System - Component Naming Conventions
 * Healthcare Context Component Standards
 * 
 * This file defines naming conventions for SupportSignal components
 * with healthcare context and NDIS compliance considerations.
 */

// Base component naming pattern: [Domain][Entity][Action?]
export const COMPONENT_NAMING = {
  // Incident Management Components
  INCIDENT: {
    PREFIX: 'Incident',
    COMPONENTS: [
      'IncidentCard',           // List/grid display component
      'IncidentMetadata',       // Basic incident information display
      'IncidentStatus',         // Status badge/indicator
      'IncidentProgress',       // Workflow progress indicator
      'IncidentActions',        // Action buttons for incident
      'IncidentForm',           // Create/edit form
      'IncidentList',           // List container
      'IncidentDetails',        // Full incident details view
    ],
  },

  // Narrative Management Components  
  NARRATIVE: {
    PREFIX: 'Narrative',
    COMPONENTS: [
      'NarrativePhaseEditor',   // Multi-phase content editor
      'NarrativePhase',         // Single phase component
      'NarrativeProgress',      // Completion tracking
      'NarrativeEnhancement',   // AI enhancement display
      'NarrativeConsolidated',  // Final consolidated view
      'NarrativeHistory',       // Version history
      'NarrativeCollaboration', // Multi-user editing indicators
    ],
  },

  // Analysis Workflow Components
  ANALYSIS: {
    PREFIX: 'Analysis',
    COMPONENTS: [
      'AnalysisWorkflow',       // Step-by-step analysis process
      'AnalysisClassification', // Incident type/severity display
      'AnalysisConditions',     // Contributing conditions editor
      'AnalysisConfidence',     // AI confidence indicators
      'AnalysisResults',        // Final analysis display
      'AnalysisReview',         // Review and approval interface
    ],
  },

  // User & Permission Components
  USER: {
    PREFIX: 'User',
    COMPONENTS: [
      'UserProfile',            // User profile display/edit
      'UserRole',               // Role badge/indicator
      'UserPermissions',        // Permission level display
      'UserSession',            // Session status indicator
      'UserAvatar',             // Profile image component
      'UserMenu',               // User dropdown menu
    ],
  },

  // Real-time & Collaboration Components
  REALTIME: {
    PREFIX: 'Live',
    COMPONENTS: [
      'LiveStatusIndicator',    // Real-time connection status
      'LiveUpdates',            // Live update notifications
      'CollaborationBadge',     // Multi-user editing indicator
      'CollaborationUsers',     // Active users display
      'RealtimeSubscription',   // Subscription manager
      'NotificationCenter',     // Workflow handoff notifications
    ],
  },

  // Workflow Components
  WORKFLOW: {
    PREFIX: 'Workflow',
    COMPONENTS: [
      'WorkflowWizard',         // Step-by-step guided process
      'WorkflowStep',           // Individual step component
      'WorkflowProgress',       // Overall workflow progress
      'WorkflowNavigation',     // Next/back/skip controls
      'WorkflowValidation',     // Step validation display
      'WorkflowSummary',        // Final review summary
    ],
  },

  // Shared/Common Components
  SHARED: {
    PREFIX: 'SS',
    COMPONENTS: [
      'SSButton',               // Branded action button
      'SSCard',                 // Branded card container
      'SSModal',                // Branded modal dialog
      'SSForm',                 // Branded form container
      'SSTable',                // Branded data table
      'SSBadge',                // Status/info badge
      'SSSpinner',              // Loading indicator
      'SSTooltip',              // Help/info tooltip
      'SSAlert',                // Notification/alert component
      'SSLayout',               // Page layout component
    ],
  },
} as const;

// Component file organization patterns
export const FILE_STRUCTURE = {
  // Component directory structure
  DIRECTORIES: {
    INCIDENT: 'apps/web/components/incident/',
    NARRATIVE: 'apps/web/components/narrative/', 
    ANALYSIS: 'apps/web/components/analysis/',
    USER: 'apps/web/components/user/',
    REALTIME: 'apps/web/components/realtime/',
    WORKFLOW: 'apps/web/components/workflow/',
    SHARED: 'apps/web/components/shared/',
    UI: 'apps/web/components/ui/', // ShadCN components
  },

  // File naming pattern: kebab-case for files, PascalCase for components
  NAMING_PATTERN: {
    COMPONENT_FILE: 'component-name.tsx',
    TEST_FILE: 'component-name.test.tsx',
    STORY_FILE: 'component-name.stories.tsx',
    TYPES_FILE: 'component-name.types.ts',
    STYLES_FILE: 'component-name.module.css', // if needed
    INDEX_FILE: 'index.ts', // for clean imports
  },
} as const;

// Props naming conventions
export const PROPS_CONVENTIONS = {
  // Common prop patterns
  COMMON: {
    ID: 'id',                         // DOM id
    CLASS_NAME: 'className',          // CSS class override
    CHILDREN: 'children',             // React children
    ON_CLICK: 'onClick',              // Click handler
    ON_CHANGE: 'onChange',            // Change handler
    ON_SUBMIT: 'onSubmit',            // Submit handler
    DISABLED: 'disabled',             // Disabled state
    LOADING: 'isLoading',             // Loading state
    ERROR: 'error',                   // Error state/message
    VARIANT: 'variant',               // Component variant
    SIZE: 'size',                     // Component size
  },

  // Healthcare-specific props
  HEALTHCARE: {
    USER_ROLE: 'userRole',            // Current user role
    REQUIRED_PERMISSION: 'requiredPermission', // Required permission
    INCIDENT_ID: 'incidentId',        // Incident reference
    NARRATIVE_PHASE: 'narrativePhase', // Narrative phase
    WORKFLOW_STEP: 'workflowStep',    // Current workflow step
    COMPANY_ID: 'companyId',          // Company context
    SESSION_TOKEN: 'sessionToken',    // Auth session
    CONFIDENCE_SCORE: 'confidenceScore', // AI confidence
    CLASSIFICATION_TYPE: 'classificationType', // Analysis classification
  },

  // Real-time specific props
  REALTIME: {
    IS_CONNECTED: 'isConnected',      // Connection status
    IS_LIVE: 'isLive',                // Live update status
    LAST_UPDATE: 'lastUpdate',        // Last update timestamp
    ACTIVE_USERS: 'activeUsers',      // Collaborative users
    SUBSCRIPTION_ID: 'subscriptionId', // Subscription reference
  },

  // Permission-aware props
  PERMISSIONS: {
    CAN_EDIT: 'canEdit',              // Edit permission
    CAN_DELETE: 'canDelete',          // Delete permission
    CAN_VIEW: 'canView',              // View permission
    IS_OWNER: 'isOwner',              // Ownership check
    ROLE_REQUIRED: 'roleRequired',    // Required role level
  },
} as const;

// TypeScript interface naming
export const TYPE_CONVENTIONS = {
  PROPS: 'ComponentNameProps',         // Component props interface
  STATE: 'ComponentNameState',         // Component state interface  
  CONFIG: 'ComponentNameConfig',       // Configuration interface
  DATA: 'ComponentNameData',           // Data shape interface
  EVENT: 'ComponentNameEvent',         // Event interface
  HANDLER: 'ComponentNameHandler',     // Handler function type
  VARIANT: 'ComponentNameVariant',     // Variant union type
  REF: 'ComponentNameRef',             // Ref interface
} as const;

// Accessibility naming conventions (WCAG 2.1 AA compliance)
export const A11Y_CONVENTIONS = {
  ARIA_LABELS: {
    INCIDENT_STATUS: 'Incident workflow status',
    NARRATIVE_PROGRESS: 'Narrative completion progress',
    ANALYSIS_CONFIDENCE: 'AI analysis confidence level',
    USER_ROLE: 'User permission level',
    WORKFLOW_STEP: 'Current workflow step',
    SAVE_STATUS: 'Auto-save status indicator',
    COLLABORATION: 'Collaborative editing status',
    NOTIFICATIONS: 'System notifications',
  },

  ROLES: {
    MAIN: 'main',                     // Main content area
    NAVIGATION: 'navigation',         // Navigation area
    BANNER: 'banner',                 // Header/banner area
    COMPLEMENTARY: 'complementary',   // Sidebar/aside content
    CONTENTINFO: 'contentinfo',       // Footer area
    FORM: 'form',                     // Form sections
    BUTTON: 'button',                 // Interactive buttons
    TAB: 'tab',                       // Tab interface
    TABPANEL: 'tabpanel',            // Tab content panels
    DIALOG: 'dialog',                 // Modal dialogs
    ALERT: 'alert',                   // Important notifications
    STATUS: 'status',                 // Status updates
    PROGRESSBAR: 'progressbar',       // Progress indicators
  },
} as const;

// Healthcare compliance patterns
export const HEALTHCARE_PATTERNS = {
  // Component behavior patterns
  VALIDATION: {
    REQUIRED_FIELD: 'is-required',    // Required form field marker
    VALIDATION_ERROR: 'has-error',    // Validation error state
    SUCCESS_STATE: 'is-valid',        // Successful validation
    LOADING_STATE: 'is-validating',   // Validation in progress
  },

  // Professional appearance standards
  PROFESSIONAL: {
    CLEAN_SPACING: 'ss-spacing',      // Consistent spacing
    SUBTLE_SHADOWS: 'ss-shadow',      // Professional shadows
    ROUNDED_CORNERS: 'ss-rounded',    // Consistent border radius
    HIERARCHY: 'ss-hierarchy',        // Visual hierarchy
  },

  // NDIS compliance markers
  NDIS_COMPLIANCE: {
    ACCESSIBLE: 'ndis-accessible',    // WCAG 2.1 AA compliant
    PROFESSIONAL: 'ndis-professional', // Professional appearance
    SECURE: 'ndis-secure',            // Security considerations
    AUDITABLE: 'ndis-auditable',      // Audit trail capability
  },
} as const;

// Export all conventions as default
export default {
  COMPONENT_NAMING,
  FILE_STRUCTURE,
  PROPS_CONVENTIONS,
  TYPE_CONVENTIONS,
  A11Y_CONVENTIONS,
  HEALTHCARE_PATTERNS,
} as const;