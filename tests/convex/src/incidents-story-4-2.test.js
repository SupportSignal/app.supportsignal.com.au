// @ts-nocheck
import { convexTest } from "convex-test";
import { expect, test, describe, beforeEach, afterEach } from "@jest/globals";
import { api } from "../../../apps/convex/_generated/api.js";
import schema from "../../../apps/convex/schema.js";
import { PERMISSIONS } from "../../../apps/convex/permissions.js";

// Test for Story 4.2 workflow continuation features
describe("Story 4.2: Workflow Continuation System - Backend API", () => {
  let t;
  let testUser;
  let testCompany;

  beforeEach(async () => {
    t = convexTest(schema);
    
    // Create test company
    testCompany = await t.run(async (ctx) => {
      return await ctx.db.insert("companies", {
        name: "Test Company",
        slug: "test-company",
        contact_email: "test@example.com",
        status: "active",
        created_at: Date.now(),
      });
    });

    // Create test user with incident creation permissions
    testUser = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "testuser@example.com",
        password: "hashedpassword",
        role: "frontline_worker",
        company_id: testCompany,
        created_at: Date.now(),
      });
    });
  });

  afterEach(async () => {
    // Clean up is handled by convexTest automatically
  });

  describe("getMyIncompleteIncidents query", () => {
    test("returns user's incomplete incidents only", async () => {
      // Create test incidents with different statuses
      const completeIncident = await t.run(async (ctx) => {
        return await ctx.db.insert("incidents", {
          company_id: testCompany,
          reporter_name: "Test Reporter",
          participant_name: "Test Participant",
          event_date_time: "2024-09-01T10:00:00Z",
          location: "Test Location",
          capture_status: "completed",
          analysis_status: "not_started", 
          overall_status: "analysis_pending",
          created_at: Date.now(),
          created_by: testUser,
          updated_at: Date.now(),
          questions_generated: false,
          narrative_enhanced: false,
          analysis_generated: false,
        });
      });

      const incompleteIncident1 = await t.run(async (ctx) => {
        return await ctx.db.insert("incidents", {
          company_id: testCompany,
          reporter_name: "Test Reporter",
          participant_name: "Incomplete Participant 1",
          event_date_time: "2024-09-01T10:00:00Z",
          location: "Test Location",
          capture_status: "draft",
          analysis_status: "not_started",
          overall_status: "capture_pending",
          created_at: Date.now(),
          created_by: testUser,
          updated_at: Date.now(),
          questions_generated: false,
          narrative_enhanced: false,
          analysis_generated: false,
          current_step: 2,
          step_description: "Before Event",
          content_preview: "This is a preview of the incident content...",
        });
      });

      const incompleteIncident2 = await t.run(async (ctx) => {
        return await ctx.db.insert("incidents", {
          company_id: testCompany,
          reporter_name: "Test Reporter",
          participant_name: "Incomplete Participant 2",
          event_date_time: "2024-09-01T10:00:00Z",
          location: "Test Location",
          capture_status: "in_progress",
          analysis_status: "not_started",
          overall_status: "capture_pending", 
          created_at: Date.now(),
          created_by: testUser,
          updated_at: Date.now(),
          questions_generated: false,
          narrative_enhanced: false,
          analysis_generated: false,
          current_step: 4,
          step_description: "After Event",
        });
      });

      // Create incident for different user (should not be returned)
      const otherUser = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Other User",
          email: "otheruser@example.com", 
          password: "hashedpassword",
          role: "frontline_worker",
          company_id: testCompany,
          created_at: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        return await ctx.db.insert("incidents", {
          company_id: testCompany,
          reporter_name: "Other Reporter",
          participant_name: "Other Participant",
          event_date_time: "2024-09-01T10:00:00Z",
          location: "Test Location",
          capture_status: "draft",
          analysis_status: "not_started",
          overall_status: "capture_pending",
          created_at: Date.now(),
          created_by: otherUser,
          updated_at: Date.now(),
          questions_generated: false,
          narrative_enhanced: false,
          analysis_generated: false,
        });
      });

      // Create session for test user
      const sessionToken = await t.run(async (ctx) => {
        return await ctx.db.insert("sessions", {
          userId: testUser,
          sessionToken: "test-session-token",
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });
      });

      // Query incomplete incidents
      const result = await t.query(api.incidents.getMyIncompleteIncidents, {
        sessionToken: "test-session-token",
      });

      // Should return only the 2 incomplete incidents for test user
      expect(result).toHaveLength(2);
      expect(result[0].participant_name).toBe("Incomplete Participant 2"); // Most recent first
      expect(result[1].participant_name).toBe("Incomplete Participant 1");
      
      // Verify incomplete status criteria
      expect(result[0].overall_status).toBe("capture_pending");
      expect(result[1].overall_status).toBe("capture_pending");
      
      // Verify workflow progress tracking
      expect(result[0].current_step).toBe(4);
      expect(result[0].step_description).toBe("After Event");
      expect(result[1].current_step).toBe(2);
      expect(result[1].step_description).toBe("Before Event");
      expect(result[1].content_preview).toBe("This is a preview of the incident content...");
    });

    test("returns empty array when no incomplete incidents", async () => {
      // Create only completed incident
      await t.run(async (ctx) => {
        return await ctx.db.insert("incidents", {
          company_id: testCompany,
          reporter_name: "Test Reporter", 
          participant_name: "Complete Participant",
          event_date_time: "2024-09-01T10:00:00Z",
          location: "Test Location",
          capture_status: "completed",
          analysis_status: "completed",
          overall_status: "completed",
          created_at: Date.now(),
          created_by: testUser,
          updated_at: Date.now(),
          questions_generated: true,
          narrative_enhanced: true,
          analysis_generated: true,
        });
      });

      // Create session for test user
      await t.run(async (ctx) => {
        return await ctx.db.insert("sessions", {
          userId: testUser,
          sessionToken: "test-session-token",
          expires: Date.now() + 24 * 60 * 60 * 1000,
        });
      });

      const result = await t.query(api.incidents.getMyIncompleteIncidents, {
        sessionToken: "test-session-token",
      });

      expect(result).toHaveLength(0);
    });

    test("enforces company boundary isolation", async () => {
      // Create different company and user
      const otherCompany = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          name: "Other Company",
          slug: "other-company", 
          contact_email: "other@example.com",
          status: "active",
          created_at: Date.now(),
        });
      });

      const otherCompanyUser = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Other Company User",
          email: "othercompanyuser@example.com",
          password: "hashedpassword",
          role: "frontline_worker",
          company_id: otherCompany,
          created_at: Date.now(),
        });
      });

      // Create incomplete incident in other company
      await t.run(async (ctx) => {
        return await ctx.db.insert("incidents", {
          company_id: otherCompany,
          reporter_name: "Other Reporter",
          participant_name: "Other Company Participant",
          event_date_time: "2024-09-01T10:00:00Z",
          location: "Other Location",
          capture_status: "draft",
          analysis_status: "not_started",
          overall_status: "capture_pending",
          created_at: Date.now(),
          created_by: otherCompanyUser,
          updated_at: Date.now(),
          questions_generated: false,
          narrative_enhanced: false,
          analysis_generated: false,
        });
      });

      // Create session for test user in original company
      await t.run(async (ctx) => {
        return await ctx.db.insert("sessions", {
          userId: testUser,
          sessionToken: "test-session-token",
          expires: Date.now() + 24 * 60 * 60 * 1000,
        });
      });

      const result = await t.query(api.incidents.getMyIncompleteIncidents, {
        sessionToken: "test-session-token",
      });

      // Should not see incidents from other company
      expect(result).toHaveLength(0);
    });

    test("requires valid authentication", async () => {
      await expect(
        t.query(api.incidents.getMyIncompleteIncidents, {
          sessionToken: "invalid-session-token",
        })
      ).rejects.toThrow("Invalid session");
    });

    test("limits results to 10 most recent incidents", async () => {
      // Create 12 incomplete incidents
      const incidents = [];
      for (let i = 1; i <= 12; i++) {
        const incident = await t.run(async (ctx) => {
          return await ctx.db.insert("incidents", {
            company_id: testCompany,
            reporter_name: "Test Reporter",
            participant_name: `Participant ${i}`,
            event_date_time: "2024-09-01T10:00:00Z",
            location: "Test Location",
            capture_status: "draft",
            analysis_status: "not_started", 
            overall_status: "capture_pending",
            created_at: Date.now() + i, // Different timestamps for ordering
            created_by: testUser,
            updated_at: Date.now() + i,
            questions_generated: false,
            narrative_enhanced: false,
            analysis_generated: false,
            current_step: 1,
          });
        });
        incidents.push(incident);
      }

      await t.run(async (ctx) => {
        return await ctx.db.insert("sessions", {
          userId: testUser,
          sessionToken: "test-session-token",
          expires: Date.now() + 24 * 60 * 60 * 1000,
        });
      });

      const result = await t.query(api.incidents.getMyIncompleteIncidents, {
        sessionToken: "test-session-token",
      });

      // Should limit to 10 results
      expect(result).toHaveLength(10);
      
      // Should be ordered by most recent first
      expect(result[0].participant_name).toBe("Participant 12");
      expect(result[9].participant_name).toBe("Participant 3");
    });
  });

  describe("updateWorkflowProgress mutation", () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await t.run(async (ctx) => {
        return await ctx.db.insert("incidents", {
          company_id: testCompany,
          reporter_name: "Test Reporter",
          participant_name: "Test Participant",
          event_date_time: "2024-09-01T10:00:00Z",
          location: "Test Location",
          capture_status: "draft",
          analysis_status: "not_started",
          overall_status: "capture_pending",
          created_at: Date.now(),
          created_by: testUser,
          updated_at: Date.now(),
          questions_generated: false,
          narrative_enhanced: false,
          analysis_generated: false,
        });
      });

      await t.run(async (ctx) => {
        return await ctx.db.insert("sessions", {
          userId: testUser,
          sessionToken: "test-session-token",
          expires: Date.now() + 24 * 60 * 60 * 1000,
        });
      });
    });

    test("updates current step and description successfully", async () => {
      const result = await t.mutation(api.incidents.updateWorkflowProgress, {
        sessionToken: "test-session-token",
        incidentId: testIncident,
        current_step: 3,
      });

      expect(result.success).toBe(true);

      // Verify the incident was updated
      const updatedIncident = await t.run(async (ctx) => {
        return await ctx.db.get(testIncident);
      });

      expect(updatedIncident.current_step).toBe(3);
      expect(updatedIncident.step_description).toBe("During Event");
      expect(updatedIncident.updated_at).toBeGreaterThan(Date.now() - 1000);
    });

    test("updates content preview successfully", async () => {
      const longPreview = "This is a very long content preview that should be truncated to exactly 100 characters when stored in the database field because we want to limit storage space and ensure consistent preview lengths across the system.";
      
      const result = await t.mutation(api.incidents.updateWorkflowProgress, {
        sessionToken: "test-session-token", 
        incidentId: testIncident,
        current_step: 2,
        content_preview: longPreview,
      });

      expect(result.success).toBe(true);

      const updatedIncident = await t.run(async (ctx) => {
        return await ctx.db.get(testIncident);
      });

      expect(updatedIncident.current_step).toBe(2);
      expect(updatedIncident.content_preview).toHaveLength(100);
      expect(updatedIncident.content_preview).toBe(longPreview.substring(0, 100));
    });

    test("enforces incident ownership", async () => {
      // Create different user
      const otherUser = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Other User",
          email: "otheruser@example.com",
          password: "hashedpassword", 
          role: "frontline_worker",
          company_id: testCompany,
          created_at: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        return await ctx.db.insert("sessions", {
          userId: otherUser,
          sessionToken: "other-session-token",
          expires: Date.now() + 24 * 60 * 60 * 1000,
        });
      });

      await expect(
        t.mutation(api.incidents.updateWorkflowProgress, {
          sessionToken: "other-session-token",
          incidentId: testIncident,
          current_step: 3,
        })
      ).rejects.toThrow("can only update your own incidents");
    });

    test("enforces company boundary", async () => {
      // Create different company and user
      const otherCompany = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          name: "Other Company",
          slug: "other-company",
          contact_email: "other@example.com",
          status: "active",
          created_at: Date.now(),
        });
      });

      const otherCompanyUser = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Other Company User",
          email: "othercompanyuser@example.com",
          password: "hashedpassword",
          role: "frontline_worker", 
          company_id: otherCompany,
          created_at: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        return await ctx.db.insert("sessions", {
          userId: otherCompanyUser,
          sessionToken: "other-company-session",
          expires: Date.now() + 24 * 60 * 60 * 1000,
        });
      });

      await expect(
        t.mutation(api.incidents.updateWorkflowProgress, {
          sessionToken: "other-company-session",
          incidentId: testIncident,
          current_step: 3,
        })
      ).rejects.toThrow("incident belongs to different company");
    });

    test("requires valid incident ID", async () => {
      const fakeId = "fake-incident-id";
      
      await expect(
        t.mutation(api.incidents.updateWorkflowProgress, {
          sessionToken: "test-session-token",
          incidentId: fakeId,
          current_step: 3,
        })
      ).rejects.toThrow("Incident not found");
    });

    test("requires valid authentication", async () => {
      await expect(
        t.mutation(api.incidents.updateWorkflowProgress, {
          sessionToken: "invalid-session-token",
          incidentId: testIncident,
          current_step: 3,
        })
      ).rejects.toThrow("Invalid session");
    });

    test("handles optional parameters correctly", async () => {
      // Test with only step parameter
      const result1 = await t.mutation(api.incidents.updateWorkflowProgress, {
        sessionToken: "test-session-token",
        incidentId: testIncident,
        current_step: 4,
      });

      expect(result1.success).toBe(true);

      let updatedIncident = await t.run(async (ctx) => {
        return await ctx.db.get(testIncident);
      });

      expect(updatedIncident.current_step).toBe(4);
      expect(updatedIncident.step_description).toBe("After Event");
      expect(updatedIncident.content_preview).toBeUndefined();

      // Test with only preview parameter
      const result2 = await t.mutation(api.incidents.updateWorkflowProgress, {
        sessionToken: "test-session-token",
        incidentId: testIncident,
        content_preview: "New preview content",
      });

      expect(result2.success).toBe(true);

      updatedIncident = await t.run(async (ctx) => {
        return await ctx.db.get(testIncident);
      });

      expect(updatedIncident.current_step).toBe(4); // Unchanged
      expect(updatedIncident.content_preview).toBe("New preview content");
    });
  });

  describe("getWorkflowStepInfo helper function", () => {
    test("returns correct step descriptions", async () => {
      const stepTests = [
        { step: 1, expected: "Basic Information" },
        { step: 2, expected: "Before Event" }, 
        { step: 3, expected: "During Event" },
        { step: 4, expected: "After Event" },
        { step: 5, expected: "Q&A Session" },
        { step: 6, expected: "AI Enhancement" },
        { step: 7, expected: "Review & Submit" },
        { step: 99, expected: "Unknown Step" },
      ];

      // Test each step mapping
      stepTests.forEach(({ step, expected }) => {
        // Import the helper function
        const { getWorkflowStepInfo } = require("../../../apps/convex/incidents.js");
        expect(getWorkflowStepInfo(step)).toBe(expected);
      });
    });
  });
});