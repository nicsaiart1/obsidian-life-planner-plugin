# YAML Frontmatter Definitions for Life Planner

This document outlines the proposed YAML frontmatter structures for various note types used by the Life Planner plugin.

## Daily Note (`daily/YYYY-MM-DD.md`)

```yaml
---
date: YYYY-MM-DD
type: daily-note
mood: 😃 # Emoji or text
energy_level: medium # low, medium, high
tasks_completed:
  - task_id_1
  - task_id_2
habits_logged:
  habit_name_1: done
  habit_name_2: skipped
pomodoro_sessions:
  - id: "pom-ts-1698400000000" # Example timestamp-based ID
    startTime: "YYYY-MM-DDTH14:00:00"
    duration: 25
    task_title: "Draft blog post"
    projectId: "project-alpha"
    status: "completed"
  - id: "pom-ts-1698402000000"
    startTime: "YYYY-MM-DDTH14:30:00"
    duration: 25
    task_title: "Review PR #123"
    status: "completed"
reflections: "" # Brief reflection or link to a longer note
time_blocks:
  - id: "uuid-123-abc"
    title: "Morning Focus Session"
    startTime: "YYYY-MM-DDTH09:00:00"
    endTime: "YYYY-MM-DDTH11:00:00"
    allDay: false
    taskId: "task-xyz-789"
    notes: "Work on chapter 1"
  - id: "uuid-456-def"
    title: "Lunch with Team"
    startTime: "YYYY-MM-DDTH12:30:00"
    endTime: "YYYY-MM-DDTH13:30:00"
    allDay: false

# Sleep Log (Optional)
sleep_start_time: "22:30"  # Time went to bed (e.g., HH:MM)
sleep_end_time: "06:45"    # Time woke up (e.g., HH:MM)
sleep_duration_hours: 8.25 # Optional: Total sleep duration in hours (can be calculated or manually entered)
sleep_quality: "Good"      # e.g., Good, Fair, Poor, or 1-5 rating
sleep_notes: "Woke up once briefly." # Optional notes about sleep

# Meditation Sessions (Optional)
meditation_sessions:
  - duration_minutes: 20
    type: "Mindfulness"
    notes: "Felt calm and centered."
  - duration_minutes: 10
    type: "Guided Visualization"
    notes: "Listened to a new guided track."
---
```

## Weekly Note (`weekly/YYYY-WW.md`)

```yaml
---
week_number: YYYY-WW # e.g., 2023-W43
type: weekly-note
goals_reviewed:
  - goal_id_1
  - goal_id_2
highlights:
  - "Highlight 1"
  - "Highlight 2"
challenges:
  - "Challenge 1"
plan_for_next_week: "" # Summary or link
---
```

## Monthly Note (`monthly/YYYY-MM.md`)

```yaml
---
month: YYYY-MM # e.g., 2023-10
type: monthly-note
theme: "Focus on X"
major_achievements:
  - "Achievement 1"
financial_summary:
  income: 0
  expenses: 0
  savings: 0
review_notes: "" # Link to detailed review
---
```

## Yearly Note (`yearly/YYYY.md`)

```yaml
---
year: YYYY
type: yearly-note
vision_board_link: "[[link_to_vision_board]]"
annual_goals_set:
  - goal_id_A
  - goal_id_B
key_learnings:
  - "Learning 1"
---
```

## Personal Values Storage (`life-planner/values.md`)

This file is used to list your core personal values. The plugin will read these values to help you align them with your goals. Each line or bullet point is treated as a distinct value.

Example content for `life-planner/values.md`:
```
- Authenticity
- Continuous Learning
- Impact
- Well-being
- Creativity
```
*(The `life-planner/` prefix indicates it's at the root of the plugin's data directory, or vault root if the plugin operates there).*

## Goal Note (`goals/.../*.md`)

This note type defines a specific goal, its properties, and how it aligns with broader visions or values.
For tracking progress, especially for goals structured with milestones or sub-tasks, these can be listed directly within the body of this goal note using standard markdown checklist syntax (e.g., `- [ ] Uncompleted item`, `- [x] Completed item`). The plugin will use these checklists to calculate overall goal completion.

```yaml
---
id: "goal-uuid-learn-instrument" # Unique identifier for the goal
title: "Learn to Play the Guitar" # The specific title of the goal
description: "Goal to learn basic guitar chords and play simple songs within 6 months." # Optional: A more detailed description of the goal
type: goal # Type of note, e.g., goal, milestone, vision
status: "inprogress" # Current status of the goal (e.g., todo, inprogress, done, archived)
due_date: "2024-06-30" # Optional: Target completion date in YYYY-MM-DD format
parent_goal_id: "goal-uuid-personal-development-2024" # Optional: ID of a parent goal if this is a sub-goal or milestone
vision_id: "vision-become-musician" # Optional: ID of a broader vision this goal contributes to
aligned_values: ["Continuous Learning", "Creativity"] # Optional: Personal values aligned with this goal
completion_date: YYYY-MM-DD # Optional: Actual completion date
template_type: "SMART" # Optional: Indicates the structure or methodology for this goal (e.g., SMART, OKR, WOOP)
# Specific fields for OKR (if template_type is "OKR")
# objective: "Objective" 
# key_results:
#   - kr: "Key Result 1"
#     status: "on-track"
# recurrence_rule: ... # Optional: If the goal itself is recurring (less common for goals, more for tasks)
accountability_partner: "[[Contact Name]]" # Optional: Name or wikilink to a contact note for an accountability partner.
# For tasks associated with this goal, they might be separate notes or listed here if simple.
---
```

Below are examples of how the frontmatter would look for specific goal templates like OKR and WOOP.

**Example: OKR Goal**
```yaml
---
id: "goal-uuid-launch-v2"
title: "Launch Life Planner v2.0"
description: "Successfully launch version 2.0 of the Life Planner plugin with key new features."
type: goal
status: "inprogress"
due_date: "2024-03-31"
aligned_values: ["Impact", "Creativity"]
template_type: "OKR"
objective: "Successfully launch version 2.0 of the Life Planner plugin."
key_results:
  - kr_title: "Achieve 1000 beta signups."
    kr_status: "on_track"
    kr_target_value: 1000
    kr_current_value: 450
    kr_type: "number"
  - kr_title: "Resolve all critical bugs reported by beta testers."
    kr_status: "todo"
  - kr_title: "Get initial positive feedback from 20 beta users."
    kr_status: "todo"
# Milestones/tasks for this OKR would be in the note body as checklists
---
```

**Example: WOOP Goal**
```yaml
---
id: "goal-uuid-focus-morning"
title: "Focus on Most Important Task (MIT) in the Morning"
description: "Implement the WOOP method to improve morning focus."
type: goal
status: "inprogress"
aligned_values: ["Well-being", "Impact"]
template_type: "WOOP"
wish: "I will consistently complete my most important task every morning."
outcome: "I will feel accomplished and make significant progress on my projects."
obstacle: "Getting distracted by emails and social media first thing."
plan: "If I feel the urge to check emails before my MIT, then I will put my phone in another room for 1 hour."
# Progress for this WOOP goal could be tracked by how often the plan is successfully implemented, perhaps noted in daily notes.
---
```

## Project Note (`projects/ProjectName.md`)

```yaml
---
project_name: "Project Name"
type: project
status: active # active, on-hold, completed, archived
deadline: YYYY-MM-DD
related_goals:
  - goal_id_X
# Tasks might be managed via a Kanban/Gantt view plugin or linked notes
---
```

## Contact Note (`relationships/ContactName.md`)

```yaml
---
contact_name: "Contact Name"
type: contact
last_contact_date: YYYY-MM-DD
next_contact_plan: "Call on YYYY-MM-DD"
emotional_log_summary: positive # positive, neutral, negative
tags: ["friend", "colleague"]
---
```

## Task Note (Generic with Recurrence)

This outlines a generic task note, particularly showcasing how recurrence rules are defined. Tasks might be standalone notes or embedded within project or daily notes.

```yaml
---
id: "task-uuid-generate-report"
title: "Generate Weekly Sales Report"
due_date: "2023-11-03" # Current or next due date
completion_date: "2023-10-27" # Last time it was completed
status: "todo" # todo, inprogress, done
project_id: "project-sales-q4" # Optional
tags: ["reporting", "sales"]
energy_level: "medium" # Optional. Values: "low", "medium", "high"

# Recurrence Rule Definition
recurrence_rule:
  frequency: "weekly" # Options: "daily", "weekly", "monthly", "yearly" (yearly for later)
  interval: 1 # Every 1 week
  days_of_week: ["FR"] # Applicable if frequency is "weekly". e.g. ["MO", "WE", "FR"]
  # day_of_month: 15 # Applicable if frequency is "monthly" (e.g., the 15th of every month)
  start_date: "2023-10-06" # The date when this rule became active
  end_date: "2024-12-31" # Optional: when this rule no longer applies

# Example for a daily task:
# recurrence_rule:
#   frequency: "daily"
#   interval: 2 # Every 2 days
#   start_date: "2023-10-01"

# Example for a monthly task (1st of every month):
# recurrence_rule:
#   frequency: "monthly"
#   interval: 1
#   day_of_month: 1
#   start_date: "2023-10-01"
---
```

This structure can be associated with tasks managed by the "Projects & Tasks Module" or any task that needs recurring behavior.

## Budget Note (`finance/budget/YYYY-MM Budget.md`)

Budget notes are designed for monthly financial planning and tracking. They are typically stored in the `finance/budget/` directory with a name corresponding to the month and year (e.g., `2023-11 Budget.md`).

These notes primarily use markdown tables. JSON-linked calculations are a potential future enhancement, but for now, all calculations are performed manually by the user.

### Example Budget Note Template (`YYYY-MM Budget.md`):

```markdown
# Monthly Budget - {{YYYY-MM}}

## Summary

| Category          | Planned | Actual | Difference |
|-------------------|---------|--------|------------|
| Total Income      |         |        |            |
| Total Expenses    |         |        |            |
| **Net Balance**   |         |        |            |
| *Savings/Deficit* |         |        |            |

## Income

| Item          | Planned | Actual | Difference | Notes |
|---------------|---------|--------|------------|-------|
| Salary        | 3000    |        |            |       |
| Freelance Work| 500     |        |            |       |
| **Total Income**| **3500**|        |            |       |

## Fixed Expenses

| Item          | Planned | Actual | Difference | Notes |
|---------------|---------|--------|------------|-------|
| Rent/Mortgage | 1200    |        |            |       |
| Utilities     | 150     |        |            | (Water, Electricity, Gas) |
| Internet      | 60      |        |            |       |
| Phone Bill    | 50      |        |            |       |
| Subscriptions | 40      |        |            | (See finance/subscriptions.md) |
| **Total Fixed**| **1500**|        |            |       |

## Variable Expenses

| Item          | Planned | Actual | Difference | Notes |
|---------------|---------|--------|------------|-------|
| Groceries     | 400     |        |            |       |
| Dining Out    | 150     |        |            |       |
| Transportation| 100     |        |            | (Gas, Public Transport) |
| Entertainment | 100     |        |            |       |
| Personal Care | 50      |        |            |       |
| **Total Variable**| **800**|        |            |       |

## Financial Goals Contribution (Optional)

| Goal          | Planned Contribution | Actual Contribution | Notes |
|---------------|----------------------|---------------------|-------|
| Savings Fund  | 200                  |                     |       |
| Debt Repayment| 100                  |                     |       |
| **Total Goals**| **300**             |                     |       |

*(Note: All 'Actual' and 'Difference' columns, as well as 'Total' rows and the main 'Summary' table, are to be filled in manually by the user during this phase.)*
```

## Subscriptions Note (`finance/subscriptions.md`)

This note serves as a central tracker for all recurring subscriptions, helping to manage expenses and renewal dates. It is typically located at `finance/subscriptions.md`.

The information is stored in a markdown table with the following structure:

```markdown
| Service Name      | Renewal Date | Amount | Billing Cycle | Category      | Status   | Notes                           |
|-------------------|--------------|--------|---------------|---------------|----------|---------------------------------|
| Obsidian Sync     | 2024-12-01   | 8.00   | Monthly       | Work          | Active   | Core service                    |
| Netflix Premium   | 2024-11-15   | 19.99  | Monthly       | Entertainment | Active   | Shared with family              |
| Domain XYZ        | 2025-03-20   | 15.00  | Annually      | Work          | Active   | Auto-renews via Credit Card ABC |
| Music Streaming   | 2024-11-05   | 9.99   | Monthly       | Entertainment | Trial    | Cancel before trial ends        |
| Cloud Storage Pro | 2024-11-22   | 99.99  | Annually      | Utilities     | Active   | 2TB plan                        |
```

## Tax Preparation Conventions

To facilitate the collection of tax-relevant information, this plugin relies on specific tagging conventions.

### Tagging
Notes containing information or documents for tax purposes should be tagged appropriately. Recommended tags include:
-   `#tax`: For general tax-related items.
-   `#tax/YYYY`: For items specific to a tax year (e.g., `#tax/2023`, `#tax/2024`).
-   You can also add more specific tags like `#tax/receipt`, `#tax/invoice`, `#tax/medical`, etc., in conjunction with the year tag.

### Attachments
Any files embedded or linked within a note that carries a relevant tax tag (e.g., `#tax/2023`) will be considered part of the data collected for that tax period. Ensure attachments are properly linked within these notes.

### Example
A note for a business expense might look like this:

```markdown
---
title: Client Dinner - Project Alpha
date: 2023-05-15
amount: 75.50
category: meals
tags: #project/alpha #tax/2023 #tax/expense/meals
---

Meeting with [[Client X]] to discuss Project Alpha.

Receipt: ![[receipt_client_dinner_may15.pdf]] 
```
In this example, the note itself and the linked `receipt_client_dinner_may15.pdf` would be identified by a search for `#tax/2023`.

## Symptom Journal Log Note (`health/symptom-journal/YYYY-MM-DD Symptom Log.md`)

Symptom Journal Log Notes are intended for daily tracking of physical or mental symptoms. Each note typically covers a single day, allowing for detailed, timestamped entries. They are usually stored in a dedicated `health/symptom-journal/` directory, named with the date (e.g., `2023-11-15 Symptom Log.md`).

### Example Frontmatter:

```yaml
---
date: {{YYYY-MM-DD}} # Automatically set to the date of the log
type: symptom-log
tags: ["health", "symptom-tracking"] # Optional example tags
---
```

### Suggested Body Structure:

The body of the note should encourage structured, timestamped entries for each symptom occurrence or update.

```markdown
This log is for tracking symptoms throughout the day.

### HH:MM AM/PM - Symptom Name
- **Severity:** (e.g., Mild, Moderate, Severe, or 1-10 scale)
- **Duration:** (e.g., Ongoing, 30 minutes, 2 hours)
- **Description/Context:** (e.g., What it feels like, what you were doing)
- **Triggers:** (e.g., Food, activity, stress)
- **Relief Measures:** (e.g., Medication, rest, water)
- **Notes:** (Any other details)

---
*(Repeat the above structure for each symptom occurrence.)*
```

## Cycle Journal Entry Note (`health/cycle-tracking/YYYY-MM-DD Cycle Entry.md`)

Cycle Journal Entry Notes are designed for privacy-safe personal health journaling related to menstrual or other physiological cycles. Typically, one note is created per day when observations are made. These are usually stored in a dedicated `health/cycle-tracking/` directory, named with the date (e.g., `2023-11-15 Cycle Entry.md`).

### Example Frontmatter:

```yaml
---
date: {{YYYY-MM-DD}} # Automatically set to the date of the entry
type: cycle-entry
tags: ["health", "cycle-tracking"] # Optional example tags
cycle_day: 14 # Optional: Day number in the current cycle (e.g., 1, 2, ..., 28)
symptoms: # Optional: List of observed symptoms or feelings
  - "bloating"
  - "mood_elevated"
  - "headache_mild"
energy_level: "medium" # Optional: Subjective energy level (e.g., "low", "medium", "high")
# Add other custom fields as needed, e.g., flow: "light", temperature: 36.5
---
```

The body of the note is for freeform journaling about the day's observations, feelings, physical sensations, or any other relevant information. This allows for detailed, private reflection without a rigid structure imposed on the narrative part of the entry.
