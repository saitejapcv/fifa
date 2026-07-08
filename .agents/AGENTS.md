# Agent Rules & Hackathon Guidelines

This document details the style guidelines, behavioral constraints, and instructions for code written in the **fifa** project, aligned with the hackathon evaluation criteria.

---

## 0. Project Scope & Hackathon Problem Statement

*   **Theme**: Smart Stadiums & Tournament Operations
*   **Goal**: Build a GenAI-enabled solution that enhances stadium operations and the overall tournament experience for fans, organizers, volunteers, or venue staff during the FIFA World Cup 2026.
*   **Core Capabilities**: Leverage GenAI to improve navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, or real-time decision support.

---

## 1. Hackathon Evaluation Criteria & Code Guidelines


All code generated for this repository must strictly adhere to the following rules based on the hackathon rubrics:

### 🌟 Code Quality (High Impact)
*   **Structure & Readability**: Follow clean code principles (clear variable/function naming, single responsibility principle).
*   **Documentation**: Include clean comments and docstrings. Maintain a comprehensive `README.md` explaining setup and usage.
*   **Linting & Style**: Adhere to language-specific standard style guides (e.g., PEP 8 for Python, ESLint/Prettier for JavaScript).

### 🌟 Goal Alignment & Product Impact (High Impact)
*   **Challenge Fit**: Focus on addressing the root challenge, user needs, and core objectives directly without bloat.
*   **No Placeholders**: Avoid dummy/placeholder implementations. UI inputs, API calls, and logic must be functional.

### 🛡️ Security (Medium Impact)
*   **No Credentials in Code**: Never commit raw API keys, passwords, or secrets. Use environment variables (via `.env` or system environment).
*   **Input Validation**: Sanitize and validate all user inputs to prevent vulnerabilities like injection, XSS, or path traversal.
*   **Dependencies**: Ensure third-party libraries are trusted, updated, and do not introduce known security vulnerabilities.

### ⚡ Performance & Resource Efficiency (Medium Impact)
*   **Time Complexity**: Optimize algorithms and database/data operations to run efficiently.
*   **Memory Management**: Avoid memory leaks, optimize payload sizes, and utilize streams or batching where appropriate.

### 🧪 Testability & Maintainability (Low Impact)
*   **Unit & Integration Tests**: Include automated tests to validate the core logic.
*   **Modularity**: Design components/modules to be easily testable in isolation.

### 🌍 Usability & Environment Portability (Low Impact)
*   **User Interface**: Ensure clear, premium, responsive UI design (with appropriate styling, color palettes, and intuitive UX).
*   **Cross-environment**: Code should run reliably across typical setups (e.g., standard Node/Python environments with standard dependency installations).

---

## 2. Git & GitHub Workflow

When pushing code:
1.  Initialize git using `git init` and set the main branch to `main`.
2.  Maintain a clean `.gitignore` to avoid committing build files, dependencies (`node_modules`, `venv`), and environment secrets (`.env`).
3.  Use GitHub CLI (`gh`) to create the repository under the user's authenticated account (`saitejapcv`) and push the commits.

---

## 3. Multi-Agent Orchestration Framework

Antigravity (this agent) serves as the **Orchestrator**. It plans work, delegates tasks to sub-agents, validates their output, and uses chain-prompting to iterate until quality standards are met.

### 3.1 Agent Registry & Model Capabilities

| Agent | Available Models | Best For |
|---|---|---|
| **Antigravity** (Orchestrator) | Gemini 3.5 Flash, Gemini 3.5 Pro, Claude Opus 4.6 (Thinking), Claude Sonnet | Architecture, planning, orchestration, complex reasoning, UI/UX design, validation & review |
| **Codex** | GPT-5.4, GPT-5.5 (Low / Medium / High reasoning) | Code generation, refactoring, debugging, test writing, API integration |
| **OpenCode** | Big-Pickel, Kimi K2.6, Nemotron 3 Ultra, North Mini Code | Rapid code generation, optimization, specialized code tasks |

### 3.2 Model Routing Strategy

When assigning a task, the Orchestrator selects the agent and model based on:

*   **Architecture / Planning / Review** → Antigravity (Claude Opus 4.6 Thinking or Gemini 3.5 Pro)
*   **Core Feature Code (complex logic, API integration)** → Codex (GPT-5.5, High reasoning)
*   **Boilerplate / Scaffolding / Simple code** → Codex (GPT-5.4, Low reasoning) or OpenCode (North Mini Code)
*   **Performance-critical optimization** → OpenCode (Nemotron 3 Ultra)
*   **Rapid prototyping / exploratory code** → OpenCode (Kimi K2.6 or Big-Pickel)
*   **UI/UX, Styling, Frontend polish** → Antigravity (Gemini 3.5 Flash)
*   **Security audit / code review** → Antigravity (Claude Opus 4.6 Thinking)

### 3.3 Orchestration Workflow

```
┌─────────────────────────────────────────────────────┐
│                  USER REQUEST                        │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│          ANTIGRAVITY (Orchestrator)                   │
│  1. Break task into sub-tasks                        │
│  2. Update task.md with assignments                  │
│  3. Select agent + model for each sub-task           │
│  4. Write prompts for sub-agents                     │
└──────────────────────┬──────────────────────────────┘
                       ▼
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  CODEX   │  │ OPENCODE │  │ANTIGRAVITY│
   │ (worker) │  │ (worker) │  │ (worker)  │
   └────┬─────┘  └────┬─────┘  └────┬─────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│        ANTIGRAVITY (Validator)                        │
│  1. Read output files created by sub-agent           │
│  2. Validate against hackathon rubrics               │
│  3. If PASS → Mark task complete in task.md          │
│  4. If FAIL → Chain-prompt: write correction         │
│     instructions and re-assign to sub-agent          │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│          Update orchestration_log.md                 │
│  - Record: task, agent, model, status, feedback      │
└─────────────────────────────────────────────────────┘
```

### 3.4 Task Tracking Files

| File | Purpose |
|---|---|
| `.agents/task.md` | Master task list with assignments, statuses, and agent/model used |
| `.agents/orchestration_log.md` | Chronological log of delegations, validations, and chain-prompt iterations |

### 3.5 Chain-Prompting Protocol

When a sub-agent's output fails validation:
1.  Antigravity documents the specific issues in `orchestration_log.md`.
2.  Antigravity composes a **correction prompt** that includes:
    *   The original task context.
    *   The specific failures (e.g., "missing input validation", "no error handling").
    *   Clear instructions for the fix.
3.  The correction prompt is given to the user to paste into the sub-agent.
4.  This cycle repeats until the output passes all quality checks.
