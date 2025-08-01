# Components

### **Component Interaction Diagram**

```mermaid
graph TD
    subgraph "Development Environment"
        Dev[🧑‍💻 Context Engineer <br> in Claude Code] -- "Invokes" --> DevAgents[BMAD Agents <br> (Personas)]
    end

    subgraph "Live Application"
        User[👤 End User] --> WebApp[WebApp (Next.js)]
        WebApp -- "Calls Tools via Chat" --> AIToolService[AI Tool Service <br> (Vercel AI SDK)]
        WebApp -- "HTTP" --> EdgeAPI[Edge API (Workers)]
        WebApp -- "Real-time" --> ConvexBackend[Real-time Backend (Convex)]
        
        EdgeAPI --> ConvexBackend
        AIToolService -- "Queries" --> KnowledgeBase[Knowledge Base <br> (Vectorize DB)]
        AIToolService -- "Invokes" --> ClaudeAPI[Claude API]
    end

    DevAgents -- "Writes/Refactors Code for" --> LiveApplication
```
