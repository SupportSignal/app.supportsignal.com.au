# API Implementation Details

## Cloudflare Worker Endpoints (OpenAPI 3.0)

This defines the strict contract for our public-facing HTTP API served by Cloudflare Workers.

```yaml
openapi: 3.0.1
info:
  title: "Agentic Starter API"
  version: "1.0.0"
servers:
  - url: "/api/v1"
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    AgentTaskRequest:
      type: object
      properties:
        taskDescription:
          type: string
          description: "A natural language description of the task for the agent."
        targetComponent:
          type: string
          description: "The component or file the task should target."
    AgentTaskResponse:
      type: object
      properties:
        taskId:
          type: string
          description: "A unique ID for the accepted task."
paths:
  /agent-task:
    post:
      summary: "Accepts a direct task for the AI agent workforce."
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AgentTaskRequest'
      responses:
        '202':
          description: "Task accepted for processing."
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgentTaskResponse'
```

## Convex Backend Functions (Signatures)

This defines the primary data API for our frontend, written as type-safe Convex function signatures.

  * **Queries:**
      * `users:getCurrentUser()`: `Query<UserProfile | null>`
      * `chat:listSessions()`: `Query<ChatSession[]>`
      * `chat:listMessages(args: { sessionId: Id<"chatSessions"> })`: `Query<ChatMessage[]>`
      * `logs:listRecentEntries(args: { limit?: number })`: `Query<LogEntry[]>`
  * **Mutations:**
      * `chat:createSession(args: { title: string })`: `Mutation<Id<"chatSessions">>`
      * `chat:sendMessage(args: { sessionId: Id<"chatSessions">, content: string })`: `Mutation<Id<"chatMessages">>`
      * `theme:updateUserTheme(args: { settings: object })`: `Mutation<void>`
  * **Actions:**
      * `agent:runRAGQuery(args: { sessionId: Id<"chatSessions">, message: string })`: `Action<void>`
      * `agent:runCodeModification(args: { taskDescription: string })`: `Action<string>`
      * `agent:seedDatabase(args: { profile: string })`: `Action<string>`
