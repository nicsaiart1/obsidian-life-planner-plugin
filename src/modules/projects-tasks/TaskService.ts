// src/modules/projects-tasks/TaskService.ts
import { Task, TaskStatus, TaskPriority } from './types';
import { v4 as uuidv4 } from 'uuid';
// We might need ProjectService to validate projectId if strict validation is desired,
// but for now, we'll assume projectId is valid if provided.
// import { getProject } from './ProjectService';

// In-memory store for tasks
let tasks: Task[] = [];

/**
 * Creates a new task.
 * @param data - Object containing task details.
 * @returns The newly created Task object.
 */
export function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Task {
    const now = new Date().toISOString();
    const newTask: Task = {
        id: uuidv4(),
        ...data,
        createdAt: now,
        updatedAt: now,
        completedAt: data.status === TaskStatus.DONE ? now : undefined,
    };
    tasks.push(newTask);
    return newTask;
}

/**
 * Retrieves a task by its ID.
 * @param id - The ID of the task to retrieve.
 * @returns The Task object if found, otherwise undefined.
 */
export function getTask(id: string): Task | undefined {
    return tasks.find(t => t.id === id);
}

/**
 * Updates an existing task.
 * Handles setting `completedAt` if status changes to DONE.
 * @param id - The ID of the task to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated Task object if found, otherwise undefined.
 */
export function updateTask(
    id: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>>
): Task | undefined {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
        return undefined;
    }

    const originalTask = tasks[taskIndex];
    const now = new Date().toISOString();
    
    let completedAt = originalTask.completedAt;
    if (updates.status && updates.status === TaskStatus.DONE && originalTask.status !== TaskStatus.DONE) {
        completedAt = now;
    } else if (updates.status && updates.status !== TaskStatus.DONE) {
        completedAt = undefined; // Reset completedAt if task is moved out of DONE status
    }

    tasks[taskIndex] = {
        ...originalTask,
        ...updates,
        completedAt,
        updatedAt: now,
    };
    return tasks[taskIndex];
}

/**
 * Deletes a task by its ID.
 * @param id - The ID of the task to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export function deleteTask(id: string): boolean {
    const initialLength = tasks.length;
    tasks = tasks.filter(t => t.id !== id);
    return tasks.length < initialLength;
}

/**
 * Retrieves all tasks, optionally sorted by a specific key.
 * @param sortBy - Optional key of Task to sort by. Default sort is by createdAt descending.
 * @returns An array of all Task objects.
 */
export function getAllTasks(sortBy?: keyof Task): Task[] {
    let sortedTasks = [...tasks];
    if (sortBy) {
        sortedTasks.sort((a, b) => {
            if (a[sortBy]! < b[sortBy]!) return -1;
            if (a[sortBy]! > b[sortBy]!) return 1;
            return 0;
        });
    } else {
        // Default sort: createdAt, newest first
        sortedTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sortedTasks;
}

interface TaskFilters {
    projectId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string; // Exact due date match YYYY-MM-DD
    isDue?: boolean; // If true, returns tasks due on or before today, and not Done/Cancelled
}

/**
 * Retrieves tasks based on a variety of filter criteria.
 * @param filter - An object containing filter criteria.
 * @returns An array of Task objects matching the filter.
 */
export function getTasksFiltered(filter: TaskFilters = {}): Task[] {
    let filteredTasks = tasks;

    if (filter.projectId) {
        filteredTasks = filteredTasks.filter(t => t.projectId === filter.projectId);
    }
    if (filter.status) {
        filteredTasks = filteredTasks.filter(t => t.status === filter.status);
    }
    if (filter.priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === filter.priority);
    }
    if (filter.dueDate) {
        filteredTasks = filteredTasks.filter(t => t.dueDate === filter.dueDate);
    }
    if (filter.isDue) {
        const today = new Date().toISOString().split('T')[0];
        filteredTasks = filteredTasks.filter(t => 
            t.dueDate && t.dueDate <= today && 
            t.status !== TaskStatus.DONE && t.status !== TaskStatus.CANCELLED
        );
    }
    // Default sort for filtered tasks: by priority (High first), then by due date (earliest first)
    return filteredTasks.sort((a, b) => {
        const priorityOrder = { [TaskPriority.HIGH]: 1, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 3, [TaskPriority.NONE]: 4 };
        if (priorityOrder[a.priority] < priorityOrder[b.priority]) return -1;
        if (priorityOrder[a.priority] > priorityOrder[b.priority]) return 1;
        if (a.dueDate && b.dueDate) {
            if (a.dueDate < b.dueDate) return -1;
            if (a.dueDate > b.dueDate) return 1;
        } else if (a.dueDate) { // a has due date, b doesn't
            return -1;
        } else if (b.dueDate) { // b has due date, a doesn't
            return 1;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Fallback to creation order
    });
}


// Helper function to reset the in-memory store, useful for testing
export function _resetTasksStore(): void {
    tasks = [];
}

// Example Usage (for internal testing)
/*
_resetTasksStore();
const task1 = createTask({ name: "Design homepage mockups", priority: TaskPriority.HIGH, status: TaskStatus.TODO, projectId: "project1", dueDate: "2023-11-15" });
const task2 = createTask({ name: "Develop API endpoints", priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, projectId: "project1", dueDate: "2023-11-20" });
const task3 = createTask({ name: "Write user documentation", priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, projectId: "project2" });
console.log("All Tasks:", getAllTasks());

updateTask(task1.id, { status: TaskStatus.IN_PROGRESS });
console.log("Task 1 Updated:", getTask(task1.id));

updateTask(task1.id, { status: TaskStatus.DONE });
console.log("Task 1 Done:", getTask(task1.id));


console.log("High Priority Tasks:", getTasksFiltered({ priority: TaskPriority.HIGH }));
console.log("Tasks for Project 1:", getTasksFiltered({ projectId: "project1" }));
console.log("Tasks Due (example, adjust date for testing):", getTasksFiltered({ isDue: true }));
*/
