// src/modules/relationships-social/SharedTasks.ts
// This module would handle tasks that are shared or delegated to contacts.
// It might integrate with the main Projects & Tasks module or be standalone.
import type { Contact } from './types';
// import type { Task } from '../projects-tasks/types'; // If integrating

export interface SharedTask {
    id: string;
    title: string;
    description?: string;
    contactId: string; // ID of the contact this task is shared with or assigned to
    // originalTaskId?: string; // If this task is linked from the main task manager
    status: 'Pending' | 'In Progress' | 'CompletedByContact' | 'CompletedBySelf' | 'Cancelled';
    dueDate?: string; // YYYY-MM-DD
    createdAt: string;
    completedAt?: string;
}

let sharedTasks: SharedTask[] = [];

/**
 * Creates or records a task shared with a contact.
 * @param title - The title of the shared task.
 * @param contactId - The ID of the contact involved.
 * @param description - Optional description.
 * @param dueDate - Optional due date.
 * @returns The ID of the newly created shared task.
 */
export function createSharedTaskWithContact(
    title: string,
    contactId: string,
    description?: string,
    dueDate?: string
): string {
    const id = `sharedtask-${Date.now()}`; // Simple ID
    const newSharedTask: SharedTask = {
        id,
        title,
        contactId,
        description,
        dueDate,
        status: 'Pending',
        createdAt: new Date().toISOString(),
    };
    sharedTasks.push(newSharedTask);
    console.log('Created shared task with contact (conceptual):', newSharedTask);
    return id;
}

/**
 * Retrieves shared tasks, optionally filtered by contact.
 * @param contactId - Optional contact ID to filter tasks for.
 * @returns An array of SharedTask objects.
 */
export function getSharedTasks(contactId?: string): SharedTask[] {
    let tasks = [...sharedTasks];
    if (contactId) {
        tasks = tasks.filter(st => st.contactId === contactId);
    }
    return tasks.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Updates the status of a shared task.
 * @param sharedTaskId - The ID of the shared task.
 * @param status - The new status.
 */
export function updateSharedTaskStatus(sharedTaskId: string, status: SharedTask['status']): void {
    const task = sharedTasks.find(st => st.id === sharedTaskId);
    if (task) {
        task.status = status;
        if (status === 'CompletedByContact' || status === 'CompletedBySelf') {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = undefined;
        }
        console.log(`Updated status of shared task ${sharedTaskId} to ${status}.`);
    }
}

export function _resetSharedTasksStore(): void {
    sharedTasks = [];
}
