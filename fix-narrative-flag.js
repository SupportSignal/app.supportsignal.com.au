// Manual fix for narrative_enhanced flag
// Run this in your browser console

async function fixNarrativeFlag() {
  const incidentId = "m97fmb4wbpajccs5qenpdx9qwd7q7fsr";
  const sessionToken = localStorage.getItem('auth_session_token');
  
  if (!sessionToken) {
    console.error("❌ No session token found. Please log in.");
    return;
  }
  
  console.log("🔧 Attempting to fix narrative_enhanced flag...");
  
  try {
    // Get the Convex client
    const convex = window.convex || 
                   document.querySelector('#__next')?.__CONVEX_CLIENT__ ||
                   window.__CONVEX_CLIENT__;
    
    if (!convex) {
      console.error("❌ Could not find Convex client");
      return;
    }
    
    // Update the incident directly
    const result = await convex.mutation("incidents:updateIncidentStatus", {
      sessionToken,
      id: incidentId,
      narrative_enhanced: true
    });
    
    console.log("✅ Successfully updated narrative_enhanced flag:", result);
    console.log("🔄 Please refresh the page to see the changes");
    
    // Auto-refresh after 2 seconds
    setTimeout(() => {
      console.log("🔄 Auto-refreshing page...");
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error("❌ Failed to update flag:", error);
    
    // Alternative: Try direct database update via mutations
    console.log("🔄 Trying alternative approach...");
    
    try {
      // Force a validation refresh by calling validateWorkflowCompletion
      const validation = await convex.query("aiEnhancement:validateWorkflowCompletion", {
        sessionToken,
        incident_id: incidentId
      });
      
      console.log("🔍 Current validation status:", validation);
      
      if (validation.all_complete) {
        console.log("✅ Validation shows complete! Refreshing page...");
        window.location.reload();
      } else {
        console.log("❌ Validation still shows incomplete:", validation.missing_requirements);
      }
      
    } catch (validationError) {
      console.error("❌ Validation check failed:", validationError);
    }
  }
}

// Run the fix
fixNarrativeFlag();