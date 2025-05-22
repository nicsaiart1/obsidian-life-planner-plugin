// src/modules/tasks/TaskQueryEngine.ts
import { App, TFile, FrontMatterCache } from 'obsidian';

export interface Task {
    id: string;
    title: string;
    status?: 'todo' | 'inprogress' | 'done' | 'archived' | string;
    due_date?: string | null; // ISO Date string "YYYY-MM-DD"
    project_id?: string | null;
    filePath: string;
    energy_level?: "low" | "medium" | "high" | string; // Added
    rawFrontmatter?: any;
    // Potentially other fields like priority, tags, etc. can be added later
}

// Helper to parse date string and ignore time for comparison
function parseDateForComparison(dateStr: string): Date | null {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    // Create date at UTC midnight to avoid timezone issues in comparisons
    return new Date(Date.UTC(year, month - 1, day));
}


export async function getAllTasksFromVault(app: App): Promise<Task[]> {
    const files: TFile[] = app.vault.getMarkdownFiles();
    const tasks: Task[] = [];

    // Define what frontmatter types are considered tasks
    const taskTypes = ['task', 'project-task']; // Configurable list

    for (const file of files) {
        const fileCache = app.metadataCache.getFileCache(file);
        const frontmatter = fileCache?.frontmatter;

        if (frontmatter && frontmatter.type && taskTypes.includes(frontmatter.type as string)) {
            const task: Task = {
                id: file.path, // Using file.path as a unique ID for MVP
                title: frontmatter.title || file.basename,
                status: frontmatter.status || 'todo', // Default to 'todo' if status is missing
                due_date: frontmatter.due_date || null,
                project_id: frontmatter.project_id || null,
                filePath: file.path,
                energy_level: frontmatter.energy_level || undefined, // Added
                rawFrontmatter: { ...frontmatter }, // Store a copy
            };
            tasks.push(task);
        }
    }
    return tasks;
}

export function filterTasksForBacklog(tasks: Task[]): Task[] {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set to UTC midnight for fair comparison

    return tasks.filter(task => {
        const isDone = task.status === 'done';
        const isArchived = task.status === 'archived';

        if (isDone || isArchived) {
            return false; // Done or archived tasks are not in the backlog
        }

        if (task.due_date) {
            const dueDate = parseDateForComparison(task.due_date);
            if (dueDate && dueDate < today) {
                return true; // Overdue tasks (not done/archived) are in the backlog
            }
        } else {
            // No due date, and not done/archived
            return true; 
        }
        
        // If it has a due date that is today or in the future, and not done/archived,
        // it's not strictly "backlog" in the sense of overdue/undated.
        // However, the definition often includes all actionable non-done/non-archived tasks.
        // The prompt: (due_date is past AND not done/archived) OR (due_date is null/empty AND not done/archived)
        // This means tasks with future due dates are NOT included in this specific backlog definition.
        return false;
    });
}
