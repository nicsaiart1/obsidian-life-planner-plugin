// src/modules/projects-tasks/types.ts

export enum ProjectStatus {
  NOT_STARTED = 'Not Started',
  ACTIVE = 'Active',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed',
  ARCHIVED = 'Archived',
}

export enum TaskStatus {
  TODO = 'Todo',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
  BLOCKED = 'Blocked',
  CANCELLED = 'Cancelled',
}

export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  NONE = 'None',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  dueDate?: string; // ISO YYYY-MM-DD string for due date
  createdAt: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ (represents UTC)
  updatedAt: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ (represents UTC)
  // Consider adding color?: string for UI distinction
  // Consider adding ownerId?: string if multiple users involved
}

export interface Task {
  id: string;
  projectId?: string; // Optional: link to a Project.id
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO YYYY-MM-DD string for due date
  createdAt: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ (represents UTC)
  updatedAt: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ (represents UTC)
  completedAt?: string; // ISO 8601 format, set when task is marked 'Done'
  // Consider adding assigneeId?: string
  // Consider adding tags?: string[]
  // Consider adding subTasks?: Task[] or subTaskIds?: string[]
}
