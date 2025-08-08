#!/usr/bin/env node
/**
 * Temporary script to fix enum schema validation issues
 * by manually updating classification records to use lowercase snake_case
 */

const { ConvexHttpClient } = require("convex/browser");

const CONVEX_URL = process.env.CONVEX_URL || "https://beaming-gull-639.convex.cloud";

async function fixEnumValues() {
  const client = new ConvexHttpClient(CONVEX_URL);
  
  console.log("🔧 Starting manual enum value fixes...");
  
  // Enum mappings
  const incidentTypeMapping = {
    "Behavioural": "behavioural",
    "Environmental": "environmental", 
    "Medical": "medical",
    "Communication": "communication",
    "Other": "other"
  };
  
  const severityMapping = {
    "Low": "low",
    "Medium": "medium", 
    "High": "high"
  };
  
  try {
    // Get all classification records
    const classifications = await client.query("data:queryTable", {
      tableName: "incident_classifications",
      limit: 100
    });
    
    console.log(`Found ${classifications.length} classification records`);
    
    let updatedCount = 0;
    
    for (const classification of classifications) {
      let needsUpdate = false;
      const updates = {};
      
      // Check and fix incident_type
      if (classification.incident_type && incidentTypeMapping[classification.incident_type]) {
        updates.incident_type = incidentTypeMapping[classification.incident_type];
        needsUpdate = true;
        console.log(`Updating ${classification._id}: incident_type ${classification.incident_type} -> ${updates.incident_type}`);
      }
      
      // Check and fix severity
      if (classification.severity && severityMapping[classification.severity]) {
        updates.severity = severityMapping[classification.severity];
        needsUpdate = true;
        console.log(`Updating ${classification._id}: severity ${classification.severity} -> ${updates.severity}`);
      }
      
      if (needsUpdate) {
        try {
          // This won't work directly, but let's try
          await client.mutation("data:updateRecord", {
            tableName: "incident_classifications",
            recordId: classification._id,
            updates
          });
          updatedCount++;
        } catch (err) {
          console.error(`Failed to update ${classification._id}:`, err.message);
        }
      }
    }
    
    console.log(`✅ Updated ${updatedCount} classification records`);
    
  } catch (error) {
    console.error("❌ Error fixing enum values:", error.message);
    throw error;
  }
}

if (require.main === module) {
  fixEnumValues().catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
  });
}

module.exports = { fixEnumValues };