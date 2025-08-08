/**
 * Story 1.4 Core API Layer - Integration Examples
 * 
 * This file provides practical TypeScript examples for integrating with the
 * SupportSignal Core API Layer implemented in Story 1.4.
 */

// Type definitions for better integration
import { Id } from '../convex/_generated/dataModel';

interface SessionContext {
  token: string;
  user: {
    id: Id<"users">;
    role: string;
    company_id: Id<"companies">;
  };
}

// Example 1: Complete Incident Creation Workflow
export async function createCompleteIncident(
  ctx: any, 
  session: SessionContext,
  incidentData: {
    reporter_name: string;
    participant_name: string;
    event_date_time: string;
    location: string;
  }
) {
  try {
    console.log('🚀 Starting incident creation workflow...');
    
    // Step 1: Create the incident
    const incidentId = await ctx.runMutation("incidents:create", {
      sessionToken: session.token,
      ...incidentData
    });
    
    console.log(`✅ Incident created: ${incidentId}`);
    
    // Step 2: Create narrative container
    const narrativeId = await ctx.runMutation("narratives:create", {
      sessionToken: session.token,
      incident_id: incidentId
    });
    
    console.log(`✅ Narrative created: ${narrativeId}`);
    
    // Step 3: Set up real-time subscription for collaborative editing
    const subscription = ctx.useQuery("incidents:subscribeToIncident", {
      sessionToken: session.token,
      incident_id: incidentId
    });
    
    return {
      incidentId,
      narrativeId,
      subscription,
      // Helper functions for continued workflow
      updateNarrative: (phases: any) => ctx.runMutation("narratives:update", {
        sessionToken: session.token,
        incident_id: incidentId,
        ...phases
      }),
      completeCapture: () => ctx.runMutation("incidents:updateStatus", {
        sessionToken: session.token,
        id: incidentId,
        capture_status: "completed"
      })
    };
  } catch (error) {
    console.error('❌ Incident creation failed:', error);
    throw error;
  }
}

// Example 2: Narrative Collaboration with Real-time Updates
export function useCollaborativeNarrative(
  ctx: any,
  session: SessionContext,
  incidentId: Id<"incidents">
) {
  // Subscribe to real-time updates
  const narrativeSubscription = ctx.useQuery("narratives:subscribeToNarrative", {
    sessionToken: session.token,
    incident_id: incidentId
  });
  
  // Subscribe to user activity
  const activitySubscription = ctx.useQuery("narratives:subscribeToNarrativeActivity", {
    sessionToken: session.token,
    incident_id: incidentId
  });
  
  const updateNarrativePhase = async (phase: string, content: string) => {
    try {
      const result = await ctx.runMutation("narratives:update", {
        sessionToken: session.token,
        incident_id: incidentId,
        [phase]: content
      });
      
      console.log(`📝 Narrative ${phase} updated to version ${result.version}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to update ${phase}:`, error);
      throw error;
    }
  };
  
  const enhanceWithAI = async (phases: any) => {
    // Requires LLM access permission
    try {
      await ctx.runAction("narratives:enhance", {
        sessionToken: session.token,
        incident_id: incidentId,
        ...phases
      });
      
      console.log('🤖 Narrative enhanced with AI');
    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      throw error;
    }
  };
  
  return {
    narrative: narrativeSubscription?.narrative,
    activity: activitySubscription?.activity,
    isLoading: narrativeSubscription === undefined,
    updatePhase: updateNarrativePhase,
    enhanceWithAI,
    consolidatedView: narrativeSubscription?.narrative?.consolidated_narrative
  };
}

// Example 3: Analysis Workflow with AI Classifications
export async function performIncidentAnalysis(
  ctx: any,
  session: SessionContext,
  incidentId: Id<"incidents">
) {
  try {
    console.log('🔍 Starting analysis workflow...');
    
    // Step 1: Create analysis
    const analysisId = await ctx.runMutation("analysis:create", {
      sessionToken: session.token,
      incident_id: incidentId
    });
    
    console.log(`✅ Analysis created: ${analysisId}`);
    
    // Step 2: Subscribe to real-time analysis updates
    const analysisSubscription = ctx.useQuery("analysis:subscribeToAnalysis", {
      sessionToken: session.token,
      incident_id: incidentId
    });
    
    // Step 3: Update contributing conditions
    const updateContributingConditions = async (conditions: string, status?: string) => {
      return await ctx.runMutation("analysis:update", {
        sessionToken: session.token,
        analysis_id: analysisId,
        contributing_conditions: conditions,
        analysis_status: status
      });
    };
    
    // Step 4: Generate AI classifications
    const generateClassifications = async () => {
      const result = await ctx.runAction("analysis:generateClassifications", {
        sessionToken: session.token,
        analysis_id: analysisId
      });
      
      console.log(`🏷️ Generated ${result.classificationsCreated} classifications`);
      return result;
    };
    
    // Step 5: Subscribe to classification updates
    const classificationSubscription = ctx.useQuery("analysis:subscribeToClassifications", {
      sessionToken: session.token,
      analysis_id: analysisId
    });
    
    // Step 6: Complete analysis
    const completeAnalysis = async (notes?: string) => {
      return await ctx.runMutation("analysis:complete", {
        sessionToken: session.token,
        analysis_id: analysisId,
        completion_notes: notes
      });
    };
    
    return {
      analysisId,
      analysisSubscription,
      classificationSubscription,
      updateContributingConditions,
      generateClassifications,
      completeAnalysis,
      // Helper to check if ready for completion
      canComplete: () => {
        const analysis = analysisSubscription?.analysis;
        const classifications = classificationSubscription?.classifications;
        return analysis?.contributing_conditions?.trim().length >= 10 && 
               classifications?.length > 0;
      }
    };
  } catch (error) {
    console.error('❌ Analysis workflow failed:', error);
    throw error;
  }
}

// Example 4: Real-time Dashboard Implementation
export function useIncidentDashboard(
  ctx: any,
  session: SessionContext,
  filters?: {
    status?: "capture_pending" | "analysis_pending" | "completed";
    limit?: number;
  }
) {
  // Subscribe to company incidents
  const incidentsSubscription = ctx.useQuery("incidents:subscribeToCompanyIncidents", {
    sessionToken: session.token,
    limit: filters?.limit || 20,
    status_filter: filters?.status
  });
  
  // Helper functions for dashboard actions
  const refreshData = () => {
    // Convex automatically handles refresh, but this can trigger manual updates
    console.log('🔄 Dashboard data refreshed');
  };
  
  const getIncidentById = async (incidentId: Id<"incidents">) => {
    return await ctx.runQuery("incidents:getById", {
      sessionToken: session.token,
      id: incidentId
    });
  };
  
  const createNewIncident = async (incidentData: any) => {
    return await ctx.runMutation("incidents:create", {
      sessionToken: session.token,
      ...incidentData
    });
  };
  
  return {
    incidents: incidentsSubscription?.incidents || [],
    totalCount: incidentsSubscription?.totalCount || 0,
    lastUpdated: incidentsSubscription?.subscribedAt,
    isLoading: incidentsSubscription === undefined,
    refreshData,
    getIncident: getIncidentById,
    createIncident: createNewIncident,
    // Filtered views
    pendingCapture: incidentsSubscription?.incidents.filter(
      i => i.overall_status === "capture_pending"
    ) || [],
    pendingAnalysis: incidentsSubscription?.incidents.filter(
      i => i.overall_status === "analysis_pending"
    ) || [],
    completed: incidentsSubscription?.incidents.filter(
      i => i.overall_status === "completed"
    ) || []
  };
}

// Example 5: Session and User Management
export function useSessionManagement(ctx: any) {
  const getCurrentUser = async (sessionToken: string) => {
    return await ctx.runQuery("users:getCurrent", {
      sessionToken
    });
  };
  
  const updateWorkflowState = async (
    sessionToken: string,
    workflowType: string,
    workflowData: any
  ) => {
    await ctx.runMutation("sessions:updateWorkflowState", {
      sessionToken,
      workflowType,
      workflowData,
      saveToSession: true
    });
  };
  
  const recoverWorkflowState = async (
    sessionToken: string,
    workflowType?: string
  ) => {
    return await ctx.runQuery("sessions:recoverState", {
      sessionToken,
      workflowType
    });
  };
  
  return {
    getCurrentUser,
    updateWorkflowState,
    recoverWorkflowState
  };
}

// Example 6: Error Handling Best Practices
export async function robustAPICall<T>(
  apiCall: () => Promise<T>,
  operation: string,
  retries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await apiCall();
      
      if (attempt > 1) {
        console.log(`✅ ${operation} succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      console.error(`❌ ${operation} failed on attempt ${attempt}:`, {
        type: error.errorType || 'unknown',
        message: error.message,
        correlationId: error.correlationId,
        validationErrors: error.validationErrors
      });
      
      // Don't retry on validation errors or authorization errors
      if (
        error.errorType === 'validation_error' ||
        error.errorType === 'authorization_error' ||
        error.errorType === 'authentication_error'
      ) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        console.log(`⏳ Retrying ${operation} in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

// Example 7: Validation and Sanitization
export function validateAndSanitizeIncidentData(data: any) {
  const sanitized = {
    reporter_name: data.reporter_name?.trim(),
    participant_name: data.participant_name?.trim(),
    event_date_time: data.event_date_time?.trim(),
    location: data.location?.trim()
  };
  
  // Client-side validation (server will also validate)
  const errors: string[] = [];
  
  if (!sanitized.reporter_name || sanitized.reporter_name.length < 1) {
    errors.push('Reporter name is required');
  }
  if (sanitized.reporter_name && sanitized.reporter_name.length > 100) {
    errors.push('Reporter name must be 100 characters or less');
  }
  
  if (!sanitized.participant_name || sanitized.participant_name.length < 1) {
    errors.push('Participant name is required');
  }
  if (sanitized.participant_name && sanitized.participant_name.length > 100) {
    errors.push('Participant name must be 100 characters or less');
  }
  
  if (!sanitized.event_date_time) {
    errors.push('Event date and time is required');
  } else {
    const date = new Date(sanitized.event_date_time);
    if (isNaN(date.getTime())) {
      errors.push('Invalid event date format');
    }
  }
  
  if (!sanitized.location || sanitized.location.length < 1) {
    errors.push('Location is required');
  }
  if (sanitized.location && sanitized.location.length > 200) {
    errors.push('Location must be 200 characters or less');
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  return sanitized;
}

// Example 8: React Hook Integration
export function useIncidentWorkflow(ctx: any, session: SessionContext) {
  const [currentIncident, setCurrentIncident] = useState<Id<"incidents"> | null>(null);
  const [workflowStep, setWorkflowStep] = useState<string>('create');
  
  // Subscribe to current incident
  const incidentSubscription = currentIncident ? ctx.useQuery("incidents:subscribeToIncident", {
    sessionToken: session.token,
    incident_id: currentIncident
  }) : null;
  
  const createIncident = async (data: any) => {
    try {
      const sanitizedData = validateAndSanitizeIncidentData(data);
      
      const incidentId = await robustAPICall(
        () => ctx.runMutation("incidents:create", {
          sessionToken: session.token,
          ...sanitizedData
        }),
        'Create Incident'
      );
      
      setCurrentIncident(incidentId);
      setWorkflowStep('narrative');
      
      // Save workflow state
      await ctx.runMutation("sessions:updateWorkflowState", {
        sessionToken: session.token,
        workflowType: "incident_capture",
        workflowData: {
          incidentId,
          currentStep: 'narrative',
          completedSteps: ['create'],
          formData: sanitizedData
        }
      });
      
      return incidentId;
    } catch (error) {
      console.error('❌ Failed to create incident:', error);
      throw error;
    }
  };
  
  const nextStep = async (step: string) => {
    setWorkflowStep(step);
    
    // Update workflow state
    if (currentIncident) {
      await ctx.runMutation("sessions:updateWorkflowState", {
        sessionToken: session.token,
        workflowType: "incident_capture",
        workflowData: {
          incidentId: currentIncident,
          currentStep: step,
          completedSteps: [...getCompletedSteps(), workflowStep]
        }
      });
    }
  };
  
  const getCompletedSteps = () => {
    // Logic to determine completed steps based on incident state
    const steps = [];
    if (currentIncident) steps.push('create');
    if (incidentSubscription?.narrative) steps.push('narrative');
    if (incidentSubscription?.analysis) steps.push('analysis');
    return steps;
  };
  
  const recoverWorkflow = async () => {
    const state = await ctx.runQuery("sessions:recoverState", {
      sessionToken: session.token,
      workflowType: "incident_capture"
    });
    
    if (state?.workflowData?.incidentId) {
      setCurrentIncident(state.workflowData.incidentId);
      setWorkflowStep(state.workflowData.currentStep || 'create');
    }
  };
  
  return {
    currentIncident,
    workflowStep,
    incidentData: incidentSubscription,
    createIncident,
    nextStep,
    recoverWorkflow,
    completedSteps: getCompletedSteps(),
    canProceed: (step: string) => {
      switch (step) {
        case 'analysis':
          return incidentSubscription?.incident?.capture_status === 'completed';
        case 'complete':
          return incidentSubscription?.incident?.analysis_status === 'completed';
        default:
          return true;
      }
    }
  };
}