# NEXUS-C2 // ARCHITECTURE DECISION RECORD & DOD SYSTEM SPECIFICATION

## System Classification
- **Nomenclature**: NEXUS-C2 (Command, Control & Cognitive Orchestration Deck)
- **Primary Operator**: Department of Defense (DoD) Software Engineering & Agentic Operations
- **Security Baseline**: Zero-Trust Air-Gap Ready / NIST SP 800-207 Aligned
- **Target Platform**: macOS (Darwin ARM64 / x86_64)

---

## 1. Executive Summary & Purpose
NEXUS-C2 is a sovereign, modular, defense-grade command center engineered to orchestrate three critical pillars of modern autonomous software engineering:
1. **Google Workspace & Cloud Ecosystem**: Real-time integration of Calendar, Tasks, Gmail, Drive, GCP and NotebookLM research assets into a unified operational HUD.
2. **Local Air-Gapped Cognitive Inference**: Direct runtime integration with Ollama (`deepseek-r1`, `qwen2.5-coder`, `mistral`, `gemma`) ensuring zero outbound data egress during sensitive operations, with optional authorized cloud handoff to Google Gemini.
3. **Autonomous Agent & Runtime Supervision**: Process lifecycle management for local Python/Node services, Docker virtualization clusters, and native deep-links into the **Google Antigravity (`agy`)** autonomous engineering CLI.

---

## 2. High-Level Architecture Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│               PRESENTATION LAYER (Next.js 15 / React 19)               │
│                                                                        │
│   ┌────────────────────┐ ┌────────────────────┐ ┌──────────────────┐   │
│   │   Tactical C2 HUD  │ │ Cyber Glass Exec   │ │ Google Ops Deck  │   │
│   │  (Dark Defense HUD)│ │ (Glassmorphic BI)  │ │ (Material Matrix)│   │
│   └─────────┬──────────┘ └─────────┬──────────┘ └────────┬─────────┘   │
│             │                      │                     │             │
│             └──────────────────────┼─────────────────────┘             │
│                                    ▼                                   │
│                       State & Telemetry Store                          │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                     BACKEND & IPC CONTROLLER LAYER                     │
│                                                                        │
│  • /api/system/status     Host CPU, RAM, Uptime & Zero-Trust Checks    │
│  • /api/apps              App Registry, Live Port Ping & Latency Radar │
│  • /api/apps/action       Process Spawn, Port Kill, macOS Open Wrapper │
│  • /api/docker            Docker Daemon Supervision & Container State  │
│  • /api/ollama            Local Model Tag Discovery (127.0.0.1:11434)  │
│  • /api/ai/chat           Air-Gapped Inferences & Gemini Cloud Relay   │
│  • /api/antigravity       Antigravity (agy) Terminal & Build Engine    │
│  • /api/google            Calendar, Tasks, Gmail Triage & Drive Sync   │
└──────────────────┬─────────────────┬─────────────────┬─────────────────┘
                   │                 │                 │
       ┌───────────▼────────┐  ┌─────▼─────┐  ┌────────▼────────┐
       │   Local Runtimes   │  │  Docker   │  │   Antigravity   │
       │  • Ollama (:11434) │  │  Daemon   │  │    CLI (agy)    │
       │  • Open WebUI      │  │  Socket   │  │  Headless/Live  │
       │  • Odysseus (:7860)│  └───────────┘  └─────────────────┘
       └────────────────────┘
```

---

## 3. Defense-Grade Engineering Principles

### 3.1 Air-Gap First & Data Egress Prevention
- By default, cognitive inference routes strictly through `http://127.0.0.1:11434` (Ollama).
- External network requests are restricted to explicit user triggers.
- No telemetry or trace data is exfiltrated to external analytics providers.

### 3.2 Process Isolation & Supervision
- Spawned microservices utilize detached process pools with automatic PID registration.
- Port-level collision detection and clean termination via POSIX signal routing (`SIGTERM` / `SIGKILL`).
- Health probes execute periodic asynchronous non-blocking socket handshakes.

### 3.3 Dynamic Visualization Switching
- **Tactical C2**: High-density military HUD displaying live Zulu/UTC military time, host telemetry, real-time port latency, and DEFCON operational status.
- **Cyber Glass**: Holographic translucent view optimized for executive presentations and architectural reviews.
- **Google Ops**: Streamlined layout prioritizing Google Calendar briefings, Tasks progress, and Drive repositories.

---

## 4. Antigravity Agent Bridge
The command center acts as a mission control deck for Google Antigravity. Operators can:
1. **Interactive Build Sessions**: Spawn a dedicated, detached Terminal session executing `/opt/homebrew/bin/agy` in any target workspace directory.
2. **Headless Agent Invocations**: Issue headless task directives via `agy --print "<directive>"`, capturing structured outputs and log streams without leaving the C2 HUD.
