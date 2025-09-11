// Debug script for incident m97fmb4wbpajccs5qenpdx9qwd7q7fsr
// Run this in your browser console while on the incident page

async function debugIncident() {
  const incidentId = "m97fmb4wbpajccs5qenpdx9qwd7q7fsr";
  
  console.log("🔍 DEBUGGING INCIDENT:", incidentId);
  
  // Get the ConvexReactClient instance from window
  const convex = window.convex || window.__CONVEX_CLIENT__;
  
  if (!convex) {
    console.error("❌ Convex client not found. Make sure you're on the app page.");
    return;
  }
  
  // Get session token from localStorage or auth provider
  const sessionToken = localStorage.getItem('auth_session_token') || 
                      window.__AUTH_SESSION_TOKEN__ ||
                      "your-session-token-here";
  
  if (!sessionToken) {
    console.error("❌ Session token not found. Please log in first.");
    return;
  }
  
  try {
    // Check workflow validation
    console.log("🔍 Checking workflow validation...");
    const validation = await convex.query("aiEnhancement:validateWorkflowCompletion", {
      sessionToken,
      incident_id: incidentId
    });
    
    console.log("✅ WORKFLOW VALIDATION:", validation);
    
    // Check enhanced narrative
    console.log("🔍 Checking enhanced narrative...");
    const narrative = await convex.query("narratives:getByIncident", {
      sessionToken,
      incident_id: incidentId
    });
    
    console.log("✅ NARRATIVE DATA:", {
      exists: !!narrative,
      before_event_extra: !!narrative?.before_event_extra,
      during_event_extra: !!narrative?.during_event_extra,
      end_event_extra: !!narrative?.end_event_extra,
      post_event_extra: !!narrative?.post_event_extra,
      enhancement_complete: !!(narrative && (
        narrative.before_event_extra || 
        narrative.during_event_extra || 
        narrative.end_event_extra || 
        narrative.post_event_extra
      ))
    });
    
    // Check clarification answers
    console.log("🔍 Checking clarification answers...");
    const answers = await convex.query("aiClarification:getClarificationAnswers", {
      sessionToken,
      incident_id: incidentId
    });
    
    console.log("✅ CLARIFICATION ANSWERS:", {
      count: answers?.length || 0,
      complete: (answers?.length || 0) > 0
    });
    
    // Check incident status
    console.log("🔍 Checking incident status...");
    const incident = await convex.query("incidents:getIncidentById", {
      sessionToken,
      incident_id: incidentId
    });
    
    console.log("✅ INCIDENT STATUS:", {
      overall_status: incident?.overall_status,
      capture_status: incident?.capture_status,
      analysis_status: incident?.analysis_status,
      handoff_status: incident?.handoff_status,
      participant_name: !!incident?.participant_name,
      location: !!incident?.location,
      event_date_time: !!incident?.event_date_time
    });
    
    // Summary
    console.log("\n🎯 SUBMIT BUTTON STATUS SUMMARY:");
    console.log("- Workflow validation complete:", validation?.all_complete || false);
    console.log("- Enhanced narrative exists:", !!(narrative && (
      narrative.before_event_extra || 
      narrative.during_event_extra || 
      narrative.end_event_extra || 
      narrative.post_event_extra
    )));
    console.log("- Already submitted:", incident?.handoff_status === "ready_for_analysis" || incident?.overall_status === "ready_for_analysis");
    console.log("- Missing requirements:", validation?.missing_requirements || []);
    
  } catch (error) {
    console.error("❌ DEBUG ERROR:", error);
  }
}

// Run the debug function
debugIncident();