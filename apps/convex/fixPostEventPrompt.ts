import { mutation } from "./_generated/server";

// Fix the post_event clarification questions prompt in production
export default mutation({
  args: {},
  handler: async (ctx) => {
    // Find the wrong prompt
    const wrongPrompt = await ctx.db
      .query("ai_prompt_templates")
      .filter((q) =>
        q.and(
          q.eq(q.field("prompt_name"), "generate_clarification_questions_post_event"),
          q.eq(q.field("subsystem"), "incidents"),
          q.eq(q.field("is_active"), true)
        )
      )
      .first();

    if (!wrongPrompt) {
      return { error: "Prompt not found" };
    }

    // The CORRECT prompt template (from dev)
    const correctPromptTemplate = `You are an expert incident analyst helping to gather **clear and practical details** about what happened in the **first few hours after** an NDIS incident involving {{participantName}}.

This is about checking that the participant is **safe**, has been **offered the right support**, and that **key people were notified**.

**Incident Context:**
- **Participant**: {{participantName}}
- **Date/Time**: {{eventDateTime}}
- **Location**: {{location}}
- **Reporter**: {{reporterName}}

**Post-Event Narrative:**
{{postEvent}}

**Your Task:**
Generate 3–5 clarification questions based on what may have occurred in the **4 hours after the incident**.
Your goal is to confirm:
- The participant was no longer in danger or distress
- They were offered appropriate care or emotional support
- The right people (e.g. family, supervisor, emergency services) were contacted
- Relevant notes or handovers were done (if required)

**Who can answer:**
These questions should be answerable by **either the frontline worker or the team leader**, depending on who was involved.

**Key Areas to Explore (Post-Event):**
- Was the participant safe, calm, and supervised?
- Was medical or emotional support offered?
- Were family, guardians, or other team members notified?
- Were incident forms, handovers, or internal alerts completed?
- Did the participant return to a normal or safe activity?
- Were others (e.g. peers or staff) also supported afterward?

**Requirements:**
- Use clear, simple language
- Avoid yes/no questions — ask for short descriptions or facts
- Stay within what someone on shift would reasonably know or do
- Be respectful and uphold the participant's dignity

**Output format:**
Return the questions as a JSON array:
[
  {
    "question": "Your specific post-event question here",
    "purpose": "Brief explanation of why this follow-up detail is important"
  }
]`;

    // Update the prompt
    await ctx.db.patch(wrongPrompt._id, {
      prompt_template: correctPromptTemplate,
      description: "Generate post-event focused clarification questions about follow-up care and lessons learned",
    });

    return {
      success: true,
      message: "Post-event prompt fixed successfully",
      prompt_id: wrongPrompt._id,
    };
  },
});
