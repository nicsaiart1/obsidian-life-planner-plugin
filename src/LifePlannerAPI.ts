// src/LifePlannerAPI.ts

// Define placeholder types for Goal, DailyLog, TaskParams, PromptDefinition
// These would eventually be replaced with or augmented by more detailed interfaces
// defined elsewhere in the plugin's codebase (e.g., in the respective modules).

export interface Goal {
  id: string;
  title: string;
  status: 'todo' | 'inprogress' | 'done' | 'archived';
  // Add other relevant goal properties as they are defined
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  content: string; // Markdown content of the daily note
  tasks_completed?: string[]; // Array of task IDs
  mood?: string;
  // Add other relevant daily log properties
}

export interface TaskParams {
  title: string;
  projectId?: string;
  goalId?: string;
  dueDate?: string; // YYYY-MM-DD
  // Add other parameters needed to create a task
}

export interface PromptDefinition {
  id: string;
  text: string; // The prompt text, can include placeholders like {{date}}
  category?: string; // e.g., "reflection", "planning"
  // Add other relevant prompt properties
}

/**
 * Defines the public API that the Life Planner plugin will expose
 * for other Obsidian plugins to interact with.
 */
export interface LifePlannerAPI {
  /**
   * Retrieves all goals.
   * Future enhancements: allow filtering by status, tags, etc.
   */
  getGoals(): Goal[];

  /**
   * Retrieves the daily log for a specific date.
   * @param date - The date string in 'YYYY-MM-DD' format.
   * @returns The DailyLog object or undefined if not found.
   */
  getDailyLog(date: string): DailyLog | undefined;

  /**
   * Creates a new task in the system.
   * @param params - Parameters for the new task.
   * @returns The ID of the newly created task, or undefined if creation failed.
   */
  createTask(params: TaskParams): string | undefined;

  /**
   * Allows other plugins to register new prompts for the Journaling & Reflection module.
   * @param prompt - The prompt definition to register.
   */
  registerPrompt(prompt: PromptDefinition): void;

  // Future API methods can be added here, for example:
  // getCurrentFocusTask(): Task | undefined;
  // getTimeBlockingEntries(dateRange: { from: string, to: string }): TimeBlockEntry[];
  // logHabit(habitId: string, status: 'done' | 'skipped' | 'missed', date?: string): boolean;
}

// It's also good practice to have a way to access this API.
// Typically, a plugin might offer its API on a property of the plugin object
// once it's loaded, or via a dedicated global (though less common in Obsidian).
// For now, defining the interface is the main goal.
// Example of how it might be exposed in main.ts:
//
// export default class LifePlannerPlugin extends Plugin {
//   public api: LifePlannerAPI;
//
//   async onload() {
//     this.api = {
//       getGoals: () => { /* implementation */ return []; },
//       getDailyLog: (date) => { /* implementation */ return undefined; },
//       createTask: (params) => { /* implementation */ return undefined; },
//       registerPrompt: (prompt) => { /* implementation */ },
//     };
//     // Make the API available to other plugins
//     (this.app as any).plugins.plugins['obsidian-life-planner'] = this;
//     // Or, more robustly:
//     // (this.app as any).plugins.plugins['obsidian-life-planner']?.api
//   }
//   ...
// }
