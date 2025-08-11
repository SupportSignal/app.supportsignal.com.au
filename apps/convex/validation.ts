// @ts-nocheck
/**
 * Comprehensive Validation System for SupportSignal APIs
 * 
 * Provides Zod-based validation schemas and error handling utilities
 * for all API endpoints according to Story 1.4 requirements.
 */

import { ConvexError } from 'convex/values';
import { z } from 'zod';

// Core validation schemas
export const ValidationSchemas = {
  // User and Session validation
  sessionToken: z.string().min(32, "Session token must be at least 32 characters"),
  
  email: z.string().email("Invalid email format"),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
    
  // Incident validation
  incidentBasicInfo: z.object({
    reporter_name: z.string().trim().min(1, "Reporter name is required").max(100, "Reporter name too long"),
    participant_name: z.string().trim().min(1, "Participant name is required").max(100, "Participant name too long"),
    event_date_time: z.string()
      .refine(val => !isNaN(Date.parse(val)), "Invalid date format"),
    location: z.string().trim().min(1, "Location is required").max(200, "Location too long"),
  }),

  // Incident status validation
  incidentStatus: z.object({
    capture_status: z.enum(["draft", "in_progress", "completed"]).optional(),
    analysis_status: z.enum(["not_started", "in_progress", "completed"]).optional(),
  }).refine(
    data => data.capture_status !== undefined || data.analysis_status !== undefined,
    { message: "At least one status field must be provided" }
  ),
  
  // Narrative validation
  narrativePhases: z.object({
    before_event: z.string().optional(),
    during_event: z.string().optional(),
    end_event: z.string().optional(),
    post_event: z.string().optional(),
  }).refine(
    data => data.before_event || data.during_event || data.end_event || data.post_event,
    "At least one narrative phase must be provided"
  ),
  
  narrativePhaseText: z.string()
    .min(10, "Narrative content must be at least 10 characters")
    .max(5000, "Narrative content is too long"),
    
  // Analysis validation
  contributingConditions: z.string()
    .trim()
    .min(10, "Contributing conditions must be at least 10 characters")
    .max(10000, "Contributing conditions are too long"),
    
  analysisStatus: z.enum(["draft", "ai_generated", "user_reviewed", "completed"]),
  
  // Classification validation
  incidentType: z.enum(["behavioural", "environmental", "medical", "communication", "other"]),
  severity: z.enum(["low", "medium", "high"]),
  
  confidenceScore: z.number()
    .min(0, "Confidence score must be between 0 and 1")
    .max(1, "Confidence score must be between 0 and 1"),
    
  supportingEvidence: z.string()
    .trim()
    .min(5, "Supporting evidence must be at least 5 characters")
    .max(2000, "Supporting evidence is too long"),
    
  classificationData: z.object({
    incident_type: z.enum(["behavioural", "environmental", "medical", "communication", "other"]),
    severity: z.enum(["low", "medium", "high"]),
    supporting_evidence: z.string()
      .trim()
      .min(5, "Supporting evidence must be at least 5 characters")
      .max(2000, "Supporting evidence is too long"),
    confidence_score: z.number()
      .min(0, "Confidence score must be between 0 and 1")
      .max(1, "Confidence score must be between 0 and 1"),
  }),
  
  // Workflow state validation
  workflowType: z.enum(["incident_capture", "incident_analysis", "user_registration", "chat_session"]),
  
  workflowData: z.object({
    incidentId: z.string().optional(), // Convex ID validation would be handled separately
    currentStep: z.string().optional(),
    completedSteps: z.array(z.string()).optional(),
    formData: z.any().optional(),
    lastActivity: z.number().optional(),
    metadata: z.any().optional(),
  }),
  
  // Pagination and filtering
  pagination: z.object({
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
  }),
  
  statusFilter: z.enum(["capture_pending", "analysis_pending", "completed"]).optional(),
  
  // ID validation (for string-based IDs)
  objectId: z.string().regex(/^[a-z0-9]+$/, "Invalid ID format"),
};

// Error types for consistent error handling
export const ErrorTypes = {
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  RESOURCE_NOT_FOUND: 'resource_not_found',
  BUSINESS_LOGIC_ERROR: 'business_logic_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  EXTERNAL_SERVICE_ERROR: 'external_service_error',
} as const;

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes];

// Enhanced error class with correlation ID and context
export class ValidationError extends ConvexError {
  public readonly errorType: ErrorType;
  public readonly correlationId?: string;
  public readonly context?: any;
  public readonly validationErrors?: any;

  constructor(
    message: string,
    errorType: ErrorType = ErrorTypes.VALIDATION_ERROR,
    options?: {
      correlationId?: string;
      context?: any;
      validationErrors?: any;
    }
  ) {
    super(message);
    this.errorType = errorType;
    this.correlationId = options?.correlationId;
    this.context = options?.context;
    this.validationErrors = options?.validationErrors;
  }
}

// Validation helper functions
export const ValidationHelpers = {
  /**
   * Validate input against Zod schema and throw ValidationError on failure
   */
  validateInput<T>(schema: z.ZodSchema<T>, input: unknown, correlationId?: string): T {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        
        throw new ValidationError(
          `Validation failed: ${validationErrors.map(e => e.message).join(', ')}`,
          ErrorTypes.VALIDATION_ERROR,
          {
            correlationId,
            validationErrors,
            context: { input },
          }
        );
      }
      throw error;
    }
  },

  /**
   * Validate incident creation input
   */
  validateIncidentCreation(input: unknown, correlationId?: string) {
    return this.validateInput(ValidationSchemas.incidentBasicInfo, input, correlationId);
  },

  /**
   * Validate narrative update input
   */
  validateNarrativeUpdate(input: unknown, correlationId?: string) {
    return this.validateInput(ValidationSchemas.narrativePhases, input, correlationId);
  },

  /**
   * Validate analysis input
   */
  validateAnalysisUpdate(input: unknown, correlationId?: string) {
    const schema = z.object({
      contributing_conditions: ValidationSchemas.contributingConditions,
      analysis_status: ValidationSchemas.analysisStatus.optional(),
    });
    return this.validateInput(schema, input, correlationId);
  },

  /**
   * Validate classification data
   */
  validateClassificationData(input: unknown, correlationId?: string) {
    return this.validateInput(ValidationSchemas.classificationData, input, correlationId);
  },

  /**
   * Validate workflow state update
   */
  validateWorkflowStateUpdate(input: unknown, correlationId?: string) {
    const schema = z.object({
      workflowType: ValidationSchemas.workflowType,
      workflowData: ValidationSchemas.workflowData,
      saveToSession: z.boolean().optional(),
    });
    return this.validateInput(schema, input, correlationId);
  },

  /**
   * Sanitize text input to prevent XSS and other issues
   */
  sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  },

  /**
   * Validate email format
   */
  validateEmail(email: string, correlationId?: string): string {
    return this.validateInput(ValidationSchemas.email, email, correlationId);
  },

  /**
   * Validate session token
   */
  validateSessionToken(token: string, correlationId?: string): string {
    return this.validateInput(ValidationSchemas.sessionToken, token, correlationId);
  },

  /**
   * Generate consistent error response
   */
  createErrorResponse(
    error: Error,
    correlationId?: string,
    context?: any
  ): {
    success: false;
    error: {
      type: ErrorType;
      message: string;
      correlationId?: string;
      context?: any;
      validationErrors?: any;
    };
  } {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: {
          type: error.errorType,
          message: error.message,
          correlationId: error.correlationId || correlationId,
          context: error.context || context,
          validationErrors: error.validationErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        type: ErrorTypes.BUSINESS_LOGIC_ERROR,
        message: error.message,
        correlationId,
        context,
      },
    };
  },
};

// Rate limiting utilities (for future implementation)
export const RateLimiting = {
  /**
   * Check if action should be rate limited
   */
  async checkRateLimit(
    userId: string,
    action: string,
    windowMs: number = 60000,
    maxAttempts: number = 10
  ): Promise<boolean> {
    // Implementation would check rate limiting store (Redis, etc.)
    // For now, always allow
    console.log('🚦 RATE LIMIT CHECK', {
      userId,
      action,
      windowMs,
      maxAttempts,
      timestamp: new Date().toISOString(),
    });
    return true;
  },

  /**
   * Record action for rate limiting
   */
  async recordAction(userId: string, action: string): Promise<void> {
    // Implementation would record in rate limiting store
    console.log('📝 RATE LIMIT RECORD', {
      userId,
      action,
      timestamp: new Date().toISOString(),
    });
  },
};

// Input sanitization utilities
export const Sanitization = {
  /**
   * Sanitize all string fields in an object
   */
  sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj };
    
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = ValidationHelpers.sanitizeText(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      }
    }
    
    return sanitized;
  },

  /**
   * Remove potentially dangerous characters from user input
   */
  sanitizeUserInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[{}]/g, '') // Remove curly braces
      .replace(/[\\]/g, '') // Remove backslashes
      .trim();
  },
};

// Logging utilities for error tracking
export const ErrorLogging = {
  /**
   * Log validation error with full context
   */
  logValidationError(
    error: ValidationError,
    endpoint: string,
    userId?: string
  ): void {
    console.error('❌ VALIDATION ERROR', {
      endpoint,
      userId,
      errorType: error.errorType,
      message: error.message,
      correlationId: error.correlationId,
      context: error.context,
      validationErrors: error.validationErrors,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log business logic error
   */
  logBusinessError(
    error: Error,
    endpoint: string,
    userId?: string,
    correlationId?: string
  ): void {
    console.error('⚠️ BUSINESS LOGIC ERROR', {
      endpoint,
      userId,
      message: error.message,
      correlationId,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log successful operation for audit trail
   */
  logSuccess(
    operation: string,
    userId: string,
    correlationId: string,
    metadata?: any
  ): void {
    console.log('✅ OPERATION SUCCESS', {
      operation,
      userId,
      correlationId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },
};