#!/usr/bin/env bun
import { ConvexClient } from "convex/browser";

// Get Convex URL from environment or use default
const CONVEX_URL = process.env.CONVEX_URL || "https://beaming-gull-639.convex.cloud";
const client = new ConvexClient(CONVEX_URL);

console.log("🧹 Cleaning problematic ai_prompts data...");

// Since we can't use mutations from the client, we'll need to do this via the dashboard
// or by temporarily commenting out the schema validation
console.log("⚠️  This script requires manual intervention:");
console.log("1. Go to Convex dashboard: https://dashboard.convex.dev");
console.log("2. Navigate to the ai_prompts table");  
console.log("3. Delete all records (they will be recreated by seed script)");
console.log("4. Then run: bunx convex dev");

process.exit(0);