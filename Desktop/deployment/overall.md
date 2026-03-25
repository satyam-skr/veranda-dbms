# AutoFix System - Deep Dive & Architecture

This document provides a comprehensive overview of the AutoFix codebase, explaining the functionality and responsibility of each component and file.

---

## 🏗️ Core Architecture

The system is built on **Next.js 15**, using **Supabase** for persistence, **Postmark** for notifications, and **Perplexity/OpenRouter** for AI analysis. It orchestrates a loop between **Vercel** (deployment failures) and **GitHub** (automated code repairs).

---

## 📂 /services (Business Logic)
These services contain the heavy lifting for AI analysis and system orchestration.

### [analysis.service.ts](file:///Users/arkin/Desktop/deployment/services/analysis.service.ts)
The "Brain" of the system.
*   **Extracts** failing files from Vercel build logs.
*   **Fetches** the full source code and neighboring file titles from GitHub.
*   **Constructs** a high-context prompt for the AI.
*   **Generates** fixes using `OpenAIService` (GPT-4o-mini).
*   **Parses** and validates AI-generated code fixes.

### [openai.service.ts](file:///Users/arkin/Desktop/deployment/services/openai.service.ts)
The AI Interaction Layer.
*   **Wraps** the OpenAI SDK with a focus on reliability and structured output.
*   **Supports** code fixing, error classification, and generic chat completions.
*   **Handles** cost calculation and detailed diagnostic logging.

### [fix.service.ts](file:///Users/arkin/Desktop/deployment/services/fix.service.ts)
The "Hands" of the system.
*   **Creates** temporary branches in GitHub for fixes.
*   **Integrates** with the Syntax Checker to verify fixes before pushing.
*   **Commits** AI-generated code changes back to the repository.
*   **Records** fix attempts in the database.

### [fix-validator.service.ts](file:///Users/arkin/Desktop/deployment/services/fix-validator.service.ts)
The "Quality Control" layer.
*   **Detects** no-op fixes where AI returned the original code.
*   **Prevents** "hallucination shrinkage" (where AI returns comments like `// ... rest of code`).
*   **Identifies** merge conflict markers and other corrupted outputs.

### [syntax-checker.service.ts](file:///Users/arkin/Desktop/deployment/services/syntax-checker.service.ts)
Local Pre-push Validation.
*   Uses `node --check` and `npx tsc` to verify JS/TS syntax.
*   Ensures that only syntactically valid code reaches the repository, cutting down on redundant retry cycles.

### [deployment.service.ts](file:///Users/arkin/Desktop/deployment/services/deployment.service.ts)
Vercel Orchestrator.
*   **Triggers** redeployments on specific branches.
*   **Polls** Vercel API for deployment status (Building → Success/Error).
*   **Streams** logs for subsequent analysis if the fix fails.

### [error-classifier.ts](file:///Users/arkin/Desktop/deployment/services/error-classifier.ts)
Initial Triage.
*   Uses `OpenAIService` to determine if a failure is **Fixable** (code-related) or **Unfixable** (environment, API keys, infrastructure).
*   Categorizes errors to improve reporting and help the user understand why AutoFix might skip a repair.

### [comment-writer.service.ts](file:///Users/arkin/Desktop/deployment/services/comment-writer.service.ts)
Engagement Feature.
*   Writes an AI-generated summary/analysis comment to a random file upon repo connection to demonstrate system capabilities.

---

## 📂 /lib (Core Utilities & Infrastructure)

### [autofix.ts](file:///Users/arkin/Desktop/deployment/lib/autofix.ts)
The **Central Loop Executor**. This file contains the `autonomousFixLoop` which manages the entire lifecycle:
`Error Detection` → `Lock Project` → `AI Analysis` → `Apply Fix` → `Trigger Deploy` → `Poll Results` → `Retry/Success`.
It also includes **Flip-Flop Detection** (SHA-256 hashing) to prevent infinite loops of repeating fixes.

### [github.ts](file:///Users/arkin/Desktop/deployment/lib/github.ts)
GitHub App Management.
*   Generates installation tokens on the fly.
*   Creates authenticated Octokit clients for repo access.

### [vercel.ts](file:///Users/arkin/Desktop/deployment/lib/vercel.ts)
Wrapped Vercel API client for fetching deployments and logs.

### [supabase.ts](file:///Users/arkin/Desktop/deployment/lib/supabase.ts)
Database client configuration (Admin mode) for managing projects, failures, and fix history.

### [free-ai.ts](file:///Users/arkin/Desktop/deployment/lib/free-ai.ts)
*(Legacy)* AI Service Wrapper.
*   Previously used for free model fallback (Perplexity, OpenRouter).
*   Replaced by `OpenAIService` for production reliability, though the file remains for local testing/fallback if configured.

### [notifications.ts](file:///Users/arkin/Desktop/deployment/lib/notifications.ts)
Email system. Sends Success/Failure/Unfixable alerts to users.

### [encryption.ts](file:///Users/arkin/Desktop/deployment/lib/encryption.ts)
Security layer using AES-256-GCM to encrypt/decrypt sensitive Vercel tokens and GitHub secrets.

### [types.ts](file:///Users/arkin/Desktop/deployment/lib/types.ts)
Single source of truth for TypeScript interfaces across the entire codebase.

---

## 📂 /app (Routing & UI)

### /api (Endpoints)
*   `webhook/vercel`: Main entry point. Receives deployment failures and starts the AutoFix loop.
*   `setup/*`: Handles OAuth callbacks and project connection logic.
*   `repos/`: Dashboard data fetching (active repositories).
*   `failures/`: History of detected errors and their fix status.

### Frontend Pages
*   `page.tsx`: Landing page / Login.
*   `dashboard/`: Overview of all connected projects and recent activity.
*   `failures/[id]`: Detailed investigation page for a specific error, showing logs and fix attempts.

---

## 📂 /utils
*   `logger.ts`: Structured logging (Console + Debug File).
*   `retry.ts`: Generic retry logic with exponential backoff for external API calls.
*   `validation.ts`: Zod schemas for validating incoming request payloads.

---

## 📂 /scripts
*   Developer utilities for resetting repositories, checking database state, and manually testing GitHub tokens.

---

## 📊 Database Schema (Key Tables)
1.  **`github_installations`**: Stores GitHub App installation details.
2.  **`vercel_projects`**: Links GitHub repos to Vercel project IDs and encrypted tokens.
3.  **`failure_records`**: Core log of every failed deployment, its current status, and error signature.
4.  **`fix_attempts`**: Individual attempts by the AI to repair a specific failure, including diffs and branch names.
