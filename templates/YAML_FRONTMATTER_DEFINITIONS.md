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
  - project: "Project X"
    duration: 25 # minutes
    completed_at: "HH:MM"
reflections: "" # Brief reflection or link to a longer note
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

## Goal Note (`goals/.../*.md`)

```yaml
---
id: unique_goal_id # auto-generated
title: "Specific Goal Title"
type: goal # goal, milestone, vision
status: in-progress # todo, in-progress, completed, archived
parent_goal_id: "parent_id_if_milestone_or_sub_goal" # Optional
vision_id: "related_vision_id" # Optional
alignment_values: ["Value1", "Value2"]
deadline: YYYY-MM-DD
completion_date: YYYY-MM-DD # Optional
template_type: SMART # SMART, OKR, WOOP (if applicable)
# Specific fields for OKR
# objective: "Objective"
# key_results:
#   - kr: "Key Result 1"
#     status: "on-track"
# For tasks associated with this goal, they might be separate notes or listed here if simple.
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
