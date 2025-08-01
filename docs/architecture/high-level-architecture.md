# High Level Architecture

### **Technical Summary**

The system will be a full-stack, edge-first application built within a TypeScript monorepo. It is architected to prioritize global low-latency, exceptional developer experience, and seamless integration with a workforce of AI agents. The architecture leverages Cloudflare for hosting and edge compute, with Convex providing the real-time backend and database. This hybrid execution model ensures optimal performance and scalability, while the entire system is designed around a series of agentic feedback loops to enable self-improvement and rapid, high-quality development.

### **Platform and Infrastructure Choice**

  * **Platform:** A combination of Cloudflare and Convex.
  * **Key Services:**
      * **Cloudflare:** Pages (for hosting), Workers (for edge compute/middleware), Vectorize DB (for RAG), R2 (for object storage), KV (for edge caching).
      * **Convex:** Real-time Database, Serverless Functions (Queries, Mutations, Actions).
  * **Deployment Host and Regions:** Cloudflare's Global Edge Network.

### **Repository Structure**

  * **Structure:** Monorepo.
  * **Monorepo Tool:** Turborepo.
  * **Package Manager:** Bun.

### **High Level Architecture Diagram**

```mermaid
graph TD
    subgraph "User Interaction"
        direction LR
        User[👤 User / Context Engineer]
    end

    subgraph "Cloudflare Edge"
        direction TB
        CDN[Cloudflare CDN/Pages]
        Workers[Cloudflare Workers <br> (Middleware, Auth, API Routes)]
    end
    
    subgraph "Real-time Backend"
        direction TB
        Convex[Convex <br> (Database, Functions, Sockets)]
    end

    subgraph "AI & Development Ecosystem"
        direction TB
        AIAgents[🤖 AI Agent Workforce]
        Knowledge[Knowledge Base <br> (Vectorize DB)]
        GitHub[GitHub <br> (Repo, Actions CI/CD)]
    end

    User -- "HTTPS Request" --> CDN
    CDN -- "Serves Static Shell" --> User
    CDN -- "Invokes" --> Workers
    Workers -- "API Calls / Real-time" --> Convex
    Convex -- "Real-time Updates" --> User
    
    AIAgents -- "Reads/Writes Code" --> GitHub
    GitHub -- "Deploys via Actions" --> CDN
    AIAgents -- "Queries for Context" --> Knowledge
    AIAgents -- "Accesses Data" --> Convex
```

### **Architectural Patterns**

  * **Edge-First Architecture:** All user requests are first handled by Cloudflare's global edge network, ensuring minimal latency worldwide for both static assets and dynamic API calls.
  * **Hybrid Execution Model:** The architecture explicitly uses the best platform for each job: static hosting on Cloudflare Pages, server-side logic on Cloudflare Workers, and stateful, real-time operations on Convex.
  * **Agentic Feedback Loops:** The system is designed with explicit pathways for production telemetry, user feedback, and development events to be fed into a knowledge base, which AI agents use to improve the application. This is a core, foundational pattern.
  * **Repository Pattern (for Data Access):** Business logic will access data through an abstracted repository layer. This ensures a clean separation of concerns, simplifies testing, and makes the code easier for AI agents to reason about.
