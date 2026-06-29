# Spur AI Support Widget

A full-stack AI support widget built for Spur's Founding Engineer take-home assessment.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the Repository

```bash
git clone https://github.com/PranavGaur7/spur-takehome.git
cd spur-takehome
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create a .env file with the following:
# GEMINI_API_KEY="your_api_key_here"
# DATABASE_URL="file:./dev.db"

# Initialize the SQLite database
npx prisma db push
npx prisma generate

# Start the server (runs on port 3000)
npm run dev
```

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install

# Start the SvelteKit app (runs on port 5173)
npm run dev
```

---

## 🧪 Testing Guide

Once the app is running, try these test cases to verify the agent's logic and constraints:

1. **Domain Knowledge Test:** Ask *"Do you ship to the UK?"*
   - *Expected:* The AI politely declines, enforcing the rule that it only ships to the USA and Canada.

2. **Context & Memory Test:** Say *"Hi, my name is John."* Wait for the reply, then ask *"Can you remind me what my name is?"*
   - *Expected:* The AI remembers your name, demonstrating that the backend successfully injects conversation history into the LLM context window.

3. **Guardrail Test:** Ask *"How do I bake a chocolate cake?"*
   - *Expected:* The AI politely declines to answer, enforcing its System Prompt instruction to never invent policies or answer out-of-scope questions.

4. **Input Validation Test:** Paste a block of text larger than 1,000 characters and hit send.
   - *Expected:* The backend's Zod validation intercepts the payload before it hits the LLM, and gracefully surfaces a `"Message is too long"` error in the UI.

5. **Persistence Test:** To verify that the SQLite database is saving all conversations:
   - Open a terminal in the `/backend` folder and run `npx prisma studio`.
   - Navigate to `http://localhost:5555` to view the `Message` table.

---

## 🏗️ Architecture Overview

The system is split into a decoupled frontend and backend to mirror production microservices.

- **API Layer (`routes/chat.routes.ts`):** Handles HTTP boundaries, strict Zod validation, and session management.

- **Service Layer (`services/llm.service.ts`):** Encapsulates the LLM integration. By keeping this separated from the routing logic, we can easily plug this exact service into a WhatsApp or Instagram webhook handler later without rewriting core logic.

- **Data Layer (Prisma/SQLite):** Handles persistence. SQLite was chosen for this demo to ensure zero-friction local setup for reviewers. Because Prisma ORM abstracts the database, swapping to PostgreSQL is simply a matter of changing the connection string and provider.

---

## 🤖 LLM Notes

- **Provider:** Google Gemini (`gemini-2.5-flash`) — chosen for its speed and cost-effectiveness.
- **Prompting:** Uses a strict System Prompt seeding the agent with "SpurMart" domain knowledge (shipping, returns, hours) and explicit behavioral guardrails.
- **Safety & Cost Controls:**
  - Limits generation to `maxOutputTokens: 150` to prevent runaway costs.
  - Passes only the last 10 messages for context to optimize token usage.
  - Explicitly catches rate-limits (`429`) to return user-friendly UI errors rather than crashing the server.

---

## ⚖️ Trade-offs & "If I Had More Time..."

1. **Deployment Storage:** SQLite is used for simplicity, but on ephemeral hosting platforms (like Render's free tier), the DB resets on deploy. For production, I would swap the Prisma provider to Postgres (e.g., Neon DB).

2. **Streaming Responses:** I used standard HTTP POST requests. If I had more time, I'd implement Server-Sent Events (SSE) to stream the LLM response token-by-token for a significantly better UX.

3. **Vector DB for FAQ:** The domain knowledge is hard-coded into the system prompt. For a real product, I'd implement RAG using a lightweight vector store to dynamically query knowledge base articles.

4. **Session Hydration:** Currently, `sessionId` persists for the active window to maintain context. In a real app, I'd store the `sessionId` in `localStorage` and hydrate the UI `onMount` with historical messages from the database.
