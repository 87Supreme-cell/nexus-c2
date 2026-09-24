# NEXUS-C2 // Tactical Command Deck & Workspace

> **Defense-Grade Command, Control & Cognitive Orchestration Deck**  
> Built for the Department of Defense (DoD) Software Engineering, Autonomous Agents & Sovereign AI workflows.

[![Status](https://img.shields.io/badge/Security-Zero--Trust_Airgap-00ff9d.svg)](#)
[![Stack](https://img.shields.io/badge/Platform-macOS_ARM64-00f0ff.svg)](#)
[![Antigravity](https://img.shields.io/badge/Agent-Google_Antigravity_AGY-ffb000.svg)](#)
[![Runtimes](https://img.shields.io/badge/LLM-Local_Ollama_%2B_Gemini-9d4edd.svg)](#)

---

## ⚡ Core Operational Capabilities

- **Google Workspace Mission Radar**:
  - Live **Google Calendar** daily agenda with quick-add briefing scheduler.
  - Synchronized **Google Tasks** with status indicators and deadline tracking.
  - Priority **Gmail Triage** feed with high-priority badge alerts.
  - Quick-launch grid for Google Docs, Sheets, Slides, Drive, GCP Console, and NotebookLM.
- **Air-Gapped Cognitive Engine (Ollama)**:
  - Direct local model inference via `http://localhost:11434` with zero external data egress.
  - Auto-discovery for installed models (`deepseek-r1:8b`, `qwen2.5-coder:7b`, `gemma4-12b`, `mistral`, `ornith`).
  - Dual-engine toggle: switch instantly between offline Ollama and Google Gemini Cloud.
- **App Launcher & Process Supervisor**:
  - Live ping radar with millisecond response latency.
  - Run, stop, and inspect local Python/Node microservices (`:8080` Open WebUI, `:7860` Odysseus).
  - Native integration with macOS Chrome Apps (`Claude.app`, `Open WebUI.app`, `NotebookLM.app`, `GitHub.app`, `YouTube.app`).
  - Add and register custom applications via the UI.
- **Docker Virtualization Hub**:
  - Real-time container state inspection, start, stop, restart, and port-mapping matrix.
  - One-click Docker Desktop daemon startup.
- **Antigravity Autonomous Builder Bridge**:
  - One-click trigger (`LAUNCH AGY`) to spawn an interactive Antigravity CLI session in a dedicated macOS Terminal window.
  - Headless task execution bridge.
- **Dynamic Visualizations**:
  - **Tactical C2**: Cyber-military HUD with Zulu/UTC clocks, DEFCON level, and glowing telemetry.
  - **Cyber Glass**: High-contrast holographic glassmorphism.
  - **Google Ops**: Clean, Google-centric operational workspace.
- **DoD Mission Objectives & Goal Velocity**:
  - Interactive milestones, classification badges (`[MISSION CRITICAL]`, `[SECRET]`, `[CONFIDENTIAL]`), and velocity gauges.

---

## 🚀 Quick Start

### 1. Launch via macOS Native App Wrapper
Double-click:
```text
~/Applications/Chrome Apps/Nexus Command Center.app
```
*(Or search "Nexus Command Center" in Spotlight)*.

### 2. Manual Terminal Launch
```bash
cd "/Users/symbrook/Applications/Chrome Apps.localized/nexus-c2"
bun run start
```
Access the dashboard at: **`http://localhost:3030`**

---

## 🛠 Project Structure

```text
nexus-c2/
├── app/
│   ├── api/
│   │   ├── ai/chat/route.ts        # Unified Ollama / Gemini inference
│   │   ├── antigravity/route.ts    # Antigravity CLI terminal bridge
│   │   ├── apps/route.ts           # App registry & live ping radar
│   │   ├── apps/action/route.ts    # Process spawn, kill & open actions
│   │   ├── docker/route.ts         # Docker container supervision
│   │   ├── google/route.ts         # Calendar, Tasks, Gmail & Drive APIs
│   │   ├── ollama/route.ts         # Local Ollama model tag discovery
│   │   └── system/status/route.ts  # Host telemetry & airgap checks
│   ├── globals.css                 # Tactical scanlines & matrix themes
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Master C2 Dashboard Controller
├── components/
│   ├── HeaderHUD.tsx               # Tactical banner, Zulu clock, AGY launch
│   ├── KpiTelemetry.tsx            # Host load, airgap status, runtime KPIs
│   ├── AppCard.tsx                 # Interactive app card with live ping
│   ├── AppGrid.tsx                 # Categorized app matrix & search
│   ├── GoogleWorkspaceHub.tsx      # Calendar, Tasks, Gmail, Drive suite
│   ├── GoalTracker.tsx             # DoD OKRs & interactive milestones
│   ├── DockerManager.tsx           # Container management table
│   ├── AiTacticalConsole.tsx       # Embedded Ollama/Gemini Copilot
│   └── AddAppModal.tsx             # Custom app registration modal
├── lib/
│   ├── apps-registry.ts            # Persistent registry & default apps
│   └── goals-data.ts               # Initial goals & Google data
├── scripts/
│   └── create-mac-app.sh           # macOS native .app wrapper builder
└── types/
    └── index.ts                    # Strict TypeScript definitions
```

---

## 🛡️ DoD Verification & Audit
This project demonstrates the viability of Antigravity for Department of Defense (DoD) autonomous software engineering:
1. Strict TypeScript type enforcement (zero loose `any` types).
2. Air-gapped local model compatibility.
3. Fail-soft error boundaries on all external integrations.
4. Auditable Architecture Decision Records (`ARCHITECTURE.md`).
