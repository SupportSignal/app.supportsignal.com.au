# Epic 4: Conversational AI & RAG Foundation

**Goal:** To implement the user-facing chat interface and the foundational `KnowledgeService` connected to our Vector DB, delivering a functional chatbot that can answer questions based on ingested documents (including source code and markdown).

---
## Story 4.1: Build the Basic Chat UI
*As a user, I want a clean, familiar chat interface, so that I can easily interact with the AI assistant.*

**Acceptance Criteria:**
1.  A new page is created at `/chat`.
2.  The UI includes a message display area, a user input field, and a send button.
3.  The chat history is displayed with clear visual distinction between "user" and "assistant" messages.
4.  The input field is disabled while the assistant is generating a response.
5.  The interface is fully responsive and works on mobile devices.

---
## Story 4.2: Implement the Knowledge Ingestion Service
*As a developer, I need a backend service to process documents, create vector embeddings, and store them in our Vector DB, so that our AI has a knowledge base to retrieve context from.*

**Acceptance Criteria:**
1.  A Convex action `knowledge:addDocument` is created.
2.  This action takes text content as input.
3.  It uses a library to generate vector embeddings for chunks of the document text.
4.  The text chunks and their embeddings are successfully stored in our Cloudflare Vectorize DB.
5.  The seeding script is configured to process all key project documents in `/docs` and key source code files in `apps/` and `packages/`.

---
## Story 4.3: Implement the RAG-Powered Chat Backend
*As a developer, I want to connect the chat UI to a backend that uses RAG to generate context-aware responses, so that the chatbot can answer questions about our project.*

**Acceptance Criteria:**
1.  The `AI Tool Service` (using the Vercel AI SDK) is configured with a `queryKnowledgeBase` tool.
2.  When the user sends a message, this tool is called.
3.  The tool generates an embedding for the user's query and searches the Vectorize DB for relevant document chunks.
4.  These chunks are compiled into a context block and sent to the Claude API along with the original user query.
5.  The response from Claude is streamed back to the frontend UI.

---
## Story 4.4: Display Sources for RAG Responses
*As a user, I want to see the sources the AI used to formulate its answer, so that I can trust the information and explore the topic further.*

**Acceptance Criteria:**
1.  The RAG response object from the backend includes metadata about which document chunks were used as context.
2.  The chat UI displays a "Sources" section below each AI-generated message.
3.  This section lists the source documents (e.g., `README.md`, `ARCHITECTURE.md`) that were used to generate the answer.