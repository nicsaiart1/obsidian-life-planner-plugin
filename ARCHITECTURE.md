# Obsidian Life Planner Plugin: Comprehensive Architecture Build Document

## 🔧 Overview

The Life Planner Plugin for Obsidian is a holistic personal management system enabling users to plan, reflect, track, and organize every facet of their lives. Designed as a modular, markdown-first Obsidian plugin, it integrates deeply with daily notes, calendars, and external systems while remaining extensible and taggable.

## ⚙️ System Architecture

### 1. Core Structure

* **Framework:** TypeScript + Obsidian Plugin API
* **Data Structure:** Markdown files + YAML frontmatter
* **UI Components:** Svelte + Obsidian-native views
* **Storage:** Local vault (with sync compatibility)
* **Modular Plugin Design:** Each life domain (Time, Health, Projects, etc.) is implemented as a self-contained module with shared APIs

### 2. File/Folder Convention

```
/life-planner/
├── daily/
│   ├── YYYY-MM-DD.md
├── weekly/
│   ├── YYYY-WW.md
├── monthly/
│   ├── YYYY-MM.md
├── yearly/
│   ├── YYYY.md
├── goals/
│   ├── long-term/
│   ├── milestones/
│   ├── archived/
├── projects/
├── health/
├── finance/
├── relationships/
├── habits/
├── routines/
├── knowledge/
├── templates/
├── dashboards/
└── config.json
```

## 🧠 Core System & Navigation

* **Daily/Weekly/Monthly Templates:** Auto-generated via plugin settings
* **Yearly Dashboard:** Progress overview + links to goals, habits, metrics
* **Nested Goal Hierarchy:** Vision > Goals > Milestones > Tasks (linkable across notes)
* **Eisenhower Matrix View:** Task sorting interface in modal or pane
* **Calendar Sync:** Bi-directional Google Calendar and Apple Calendar integration using OAuth tokens, optional CalDAV support
* **Timeline View:** Implemented with D3.js for interactive visualization

## 📅 Time Management Module

* **Time Blocking Planner:** Drag-and-drop UI using fullCalendar.js
* **Pomodoro Tracker:** Built-in timer with log export to daily note
* **Task Recurrence Engine:** Cron-style YAML logic or natural language ("every Monday")
* **Backlog View:** All unassigned/overdue tasks from across the vault
* **Energy Tagging:** Assign energy requirement levels and filter tasks accordingly
* **Focus Mode UI:** Minimal UI for distraction-free execution with current task overlay

## 🔄 Habits & Routines Module

* **Routine Builder:** Visual grid editor + YAML export
* **Habit Tracker:** Data stored in daily notes and visualized with Charts.js
* **Auto Prompts:** Triggers when routine deviates; logs reflections
* **Seasonal Variants:** User-definable presets for different times of year
* **Circadian Notifications:** Custom notification system aligned to user sleep/wake times

## 🎯 Goal & Alignment Module

* **Values Integration:** Define and align goals with personal values
* **Goal Templates:** SMART, OKR, WOOP – auto-filled via UI form
* **Progress Tracking:** Milestone checklists + burndown charts
* **Visual Pyramids:** Tree-diagram rendering of vision → tasks
* **Accountability Partner Tracking:** Note-linking to contact logs

## 💬 Journaling & Reflection Module

* **Prompt Bank:** AI-augmented selection based on time, mood, or context
* **Mood Tracker:** Emoji slider with trend graphs
* **Stream-of-Consciousness Mode:** Markdown editor with blur/distraction overlay
* **Audio Journaling:** Audio recorder and file attachment in journal entry
* **AI Summary:** Optional GPT-assisted summary for entries

## 💼 Projects & Tasks Module

* **GTD Inbox:** Fuzzy input capture across vault
* **Kanban + Gantt Boards:** Project-specific views
* **Delegation Tracker:** Assign and tag tasks to contacts
* **Deadline Risk:** Color-coded based on approaching deadlines
* **Blocked Task Alerts:** Dependency-based blockage detection

## 🧾 Financial Life Module

* **Budgeting:** Markdown tables with JSON-linked calculations
* **Subscription Manager:** Expiry tracker + renewal notification
* **Expense Tagging:** Project/goal linking and categorization
* **Net Worth Chart:** Pulls from income/savings/investment data
* **Tax Prep:** Collects tags and attachments into export bundle

## ❤️ Relationships & Social Module

* **Contact Logbook:** YAML + last contact date, future plans
* **Emotional Log:** Mood + tone tagging per contact
* **Shared Tasks:** Tasks linked to people and shared notes
* **Ritual Planner:** Templates for recurring social activities
* **Dashboard View:** Influence/Trust graph for all relationships

## 🏃 Health & Wellbeing Module

* **Fitness Tracker:** Sync with Google Fit, Apple Health, or CSV import
* **Symptom Journal:** Track and export data to doctors
* **Sleep/Meditation Tracker:** Daily logs + summary dashboard
* **Cycle Tracking:** Privacy-safe personal health journaling
* **Food Log + Planner:** Tag meals and associate with energy levels

## 🧠 Knowledge Management Module

* **Reading Tracker:** Books/articles list with read status
* **Course Tracker:** Completion %, notes, and reflections
* **Zettelkasten Integration:** Link ideas and index insights
* **Thought Map:** Mind map generator using Mermaid.js
* **Insight Pipeline:** Move from Journal → Insight → Action via tags

## 🔌 Integrations

* **Calendar APIs:** Google Calendar, Apple iCal
* **Health APIs:** Google Fit, Apple Health (via local CSV or API key)
* **Audio & Transcription:** Local audio files with Whisper integration
* **AI Tools:** GPT-4 via API key for summaries, prompts

## 🔐 Security & Permissions

* **Local-first:** All data stored locally in Obsidian vault
* **Optional Sync:** Works with Obsidian Sync or external backups
* **API Keys Storage:** Encrypted vault section (using plugin password)

## 📊 Visualization Layer

* **Charts.js:** Habit/routine streaks, mood, finance
* **D3.js:** Life timeline, goal pyramids
* **Mermaid.js:** Knowledge maps, goal trees

## 🧩 Extensibility

* Plugin will expose public API for other Obsidian plugins to hook into:

  ```ts
  interface LifePlannerAPI {
    getGoals(): Goal[];
    getDailyLog(date: string): DailyLog;
    createTask(params: TaskParams): string;
    registerPrompt(prompt: PromptDefinition): void;
  }
  ```
* Settings Panel UI to enable/disable modules individually

## 📅 Deployment & Maintenance

* **Release Schedule:** Bi-monthly stable release + continuous beta
* **Issue Tracking:** GitHub with community voting
* **Plugin Hub Submission:** Planned after v1.0 stable

## ✅ Success Criteria

* Full offline capability
* Seamless markdown integration
* Real-world user scenario tested (student, freelancer, parent, etc.)
* Extendable, modular design
* Data ownership and security prioritized
