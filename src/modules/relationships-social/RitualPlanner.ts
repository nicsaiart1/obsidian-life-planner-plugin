// src/modules/relationships-social/RitualPlanner.ts
import type { Contact } from './types'; // Assuming Contact is defined

export interface ContactRitual {
    id: string;
    contactId: string;
    ritualName: string; // e.g., "Weekly Coffee Chat", "Monthly Game Night"
    details?: string;
    frequency: string; // e.g., "Weekly on Fridays", "Every 2nd Sunday of the month" (could be cron-like or human-readable)
    nextDueDate?: string; // YYYY-MM-DD
    lastCompletedDate?: string; // YYYY-MM-DD
    createdAt: string;
    isActive: boolean;
}

let plannedRituals: ContactRitual[] = [];

/**
 * Schedules or defines a new recurring ritual with a contact.
 * @param contactId - The ID of the contact.
 * @param ritualName - Name of the ritual.
 * @param details - Optional details about the ritual.
 * @param frequency - How often the ritual should occur.
 * @param nextDueDate - Optional initial due date.
 * @returns The ID of the newly scheduled ritual.
 */
export function scheduleContactRitual(
    contactId: string,
    ritualName: string,
    details: string | undefined,
    frequency: string,
    nextDueDate?: string
): string {
    const id = `ritual-${Date.now()}`; // Simple ID
    const newRitual: ContactRitual = {
        id,
        contactId,
        ritualName,
        details,
        frequency,
        nextDueDate,
        createdAt: new Date().toISOString(),
        isActive: true,
    };
    plannedRituals.push(newRitual);
    console.log('Scheduled contact ritual (conceptual):', newRitual);
    return id;
}

/**
 * Retrieves all planned rituals, optionally filtered by contact.
 * @param contactId - Optional contact ID to filter rituals for.
 * @returns An array of ContactRitual objects.
 */
export function getPlannedRituals(contactId?: string): ContactRitual[] {
    let rituals = [...plannedRituals];
    if (contactId) {
        rituals = rituals.filter(r => r.contactId === contactId);
    }
    return rituals.sort((a,b) => new Date(a.nextDueDate || 0).getTime() - new Date(b.nextDueDate || 0).getTime()); // Sort by next due date
}

/**
 * Marks a ritual as completed and potentially schedules the next one.
 * @param ritualId - The ID of the ritual to mark complete.
 * @param completionDate - The date of completion.
 */
export function markRitualAsCompleted(ritualId: string, completionDate: string = new Date().toISOString().split('T')[0]): void {
    const ritual = plannedRituals.find(r => r.id === ritualId);
    if (ritual) {
        ritual.lastCompletedDate = completionDate;
        // TODO: Conceptual: Add logic to calculate and set the next ritual.nextDueDate based on its frequency.
        console.log(`Marked ritual ${ritualId} as completed on ${completionDate}. Next due date needs calculation.`);
    }
}

export function _resetRitualsStore(): void {
    plannedRituals = [];
}
