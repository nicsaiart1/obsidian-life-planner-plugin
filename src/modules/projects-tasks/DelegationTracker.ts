// src/modules/projects-tasks/DelegationTracker.ts
import type { Task } from './types'; // Assuming Task is defined

export interface DelegatedTaskInfo {
    taskId: string;
    assignedTo: string; // Could be a user ID, name, or email
    delegationDate: string; // ISO 8601
    expectedCompletionDate?: string; // Optional: set by delegator or assignee
    delegationNotes?: string;
    statusNotified?: boolean; // If assignee has been notified of status changes
}

let delegatedTasks: DelegatedTaskInfo[] = [];

/**
 * Records that a task has been delegated.
 * In a real system, this might also trigger notifications.
 * 
 * @param taskId - The ID of the task being delegated.
 * @param assignedTo - Identifier for the person/entity the task is assigned to.
 * @param delegationNotes - Optional notes about the delegation.
 * @param expectedCompletionDate - Optional expected completion date.
 */
export function delegateTask(taskId: string, assignedTo: string, delegationNotes?: string, expectedCompletionDate?: string): DelegatedTaskInfo {
    console.log(`Task ${taskId} delegated to ${assignedTo} (conceptual). Notes: ${delegationNotes}`);
    const delegationInfo: DelegatedTaskInfo = {
        taskId,
        assignedTo,
        delegationDate: new Date().toISOString(),
        expectedCompletionDate,
        delegationNotes,
        statusNotified: false,
    };
    // In a real app, this would be saved to a persistent store.
    // For now, just an in-memory example:
    const existingIndex = delegatedTasks.findIndex(dt => dt.taskId === taskId);
    if (existingIndex > -1) {
        delegatedTasks[existingIndex] = delegationInfo;
    } else {
        delegatedTasks.push(delegationInfo);
    }
    return delegationInfo;
}

/**
 * Retrieves delegation information for a specific task.
 * @param taskId - The ID of the task.
 * @returns DelegationTaskInfo if found, otherwise undefined.
 */
export function getDelegationInfo(taskId: string): DelegatedTaskInfo | undefined {
    return delegatedTasks.find(dt => dt.taskId === taskId);
}

/**
 * Retrieves all currently tracked delegated tasks.
 * @returns An array of DelegatedTaskInfo objects.
 */
export function getAllDelegatedTasks(): DelegatedTaskInfo[] {
    return [...delegatedTasks];
}

// _resetDelegatedTasksStore for testing
export function _resetDelegatedTasksStore(): void {
    delegatedTasks = [];
}
