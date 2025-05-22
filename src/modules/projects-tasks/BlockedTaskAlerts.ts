// src/modules/projects-tasks/BlockedTaskAlerts.ts
import type { Task, TaskStatus } from './types';

/**
 * Identifies tasks that are currently marked as 'Blocked'.
 * In a more advanced system, this could also check for tasks whose
 * dependencies are not met, or tasks that haven't seen progress.
 * 
 * @param allTasks - An array of all Task objects to check.
 * @returns An array of Task objects that are considered blocked.
 */
export function identifyBlockedTasks(allTasks: Task[]): Task[] {
    console.log('Identifying blocked tasks (conceptual)');
    const blockedTasks = allTasks.filter(task => task.status === TaskStatus.BLOCKED);
    
    // Example of more advanced check (conceptual):
    // const today = new Date();
    // allTasks.forEach(task => {
    //   if (task.dueDate && new Date(task.dueDate) < today && task.status !== TaskStatus.DONE && task.status !== TaskStatus.CANCELLED) {
    //      if (!blockedTasks.find(bt => bt.id === task.id)) {
    //          // Consider overdue tasks as implicitly blocked or needing attention
    //      }
    //   }
    // });
    return blockedTasks;
}

/**
 * Generates alerts or notifications for blocked tasks.
 * @param blockedTasks - An array of tasks that are blocked.
 */
export function generateBlockedTaskAlerts(blockedTasks: Task[]): void {
    if (blockedTasks.length > 0) {
        console.log(`ALERT: ${blockedTasks.length} task(s) are currently blocked (conceptual):`);
        blockedTasks.forEach(task => {
            console.log(`  - Task: ${task.name} (ID: ${task.id})`);
        });
        // In a real app, this might create Obsidian notices or system notifications.
    }
}
