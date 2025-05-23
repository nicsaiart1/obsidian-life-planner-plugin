// src/modules/relationships-social/EmotionalLog.ts
// This log is specifically for emotions related to interactions or contacts,
// distinguishing it from a personal mood log.
import type { InteractionLog, Contact } from './types'; // Assuming types are in the same directory

export interface EmotionalContextLog {
    id: string;
    interactionId?: string; // Link to a specific interaction
    contactId?: string;     // Link to a contact, if not tied to a specific interaction
    date: string;          // ISO 8601
    emotion: string;       // e.g., "Felt understood", "Frustrated", "Joyful"
    intensity?: number;    // 1-5
    trigger?: string;      // What triggered this emotion in the context of the relationship/interaction
    notes?: string;
    createdAt: string;     // ISO 8601
}

let emotionalContextLogs: EmotionalContextLog[] = [];

/**
 * Logs an emotional context related to an interaction or a contact.
 * @param data - Data for the emotional log.
 * @returns The created EmotionalContextLog object.
 */
export function logEmotionalContext(
    data: Omit<EmotionalContextLog, 'id' | 'createdAt'>
): EmotionalContextLog {
    const newLog: EmotionalContextLog = {
        id: `ec-${Date.now()}`, // Simple ID for conceptual placeholder
        ...data,
        createdAt: new Date().toISOString(),
    };
    emotionalContextLogs.push(newLog);
    console.log('Logged emotional context for interaction/contact (conceptual):', newLog);
    return newLog;
}

/**
 * Retrieves emotional logs, optionally filtered by contact or interaction.
 * @param filter - Optional filter object.
 * @returns An array of EmotionalContextLog objects.
 */
export function getEmotionalContextLogs(
    filter?: { contactId?: string; interactionId?: string }
): EmotionalContextLog[] {
    let logs = [...emotionalContextLogs];
    if (filter?.contactId) {
        logs = logs.filter(log => log.contactId === filter.contactId);
    }
    if (filter?.interactionId) {
        logs = logs.filter(log => log.interactionId === filter.interactionId);
    }
    return logs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function _resetEmotionalContextLogsStore(): void {
    emotionalContextLogs = [];
}
