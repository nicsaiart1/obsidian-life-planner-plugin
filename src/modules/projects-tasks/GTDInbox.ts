// src/modules/projects-tasks/GTDInbox.ts
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs if needed

export interface InboxItem {
    id: string;
    type: 'task' | 'note' | 'misc' | 'meeting_note' | 'bookmark'; // Extendable
    content: string; // Could be a title or a short description
    notes?: string; // More detailed notes
    source?: string; // e.g., "email", "meeting", "random thought"
    createdAt: string; // ISO 8601
    processedAt?: string; // ISO 8601, when moved out of inbox
}

let inboxItems: InboxItem[] = [];

/**
 * Adds a new item to the GTD Inbox.
 * @param itemData - The data for the item to add.
 *                 Should include at least 'content' and 'type'.
 * @returns The ID of the newly created inbox item.
 */
export function gtdAddItemToInbox(itemData: Pick<InboxItem, 'content' | 'type' | 'notes' | 'source'>): string {
    const newItem: InboxItem = {
        id: `inbox-${uuidv4()}`,
        ...itemData,
        createdAt: new Date().toISOString(),
    };
    inboxItems.push(newItem);
    console.log('GTD Item Added to Inbox (conceptual):', newItem.id, itemData);
    return newItem.id;
}

/**
 * Retrieves all items currently in the inbox.
 * @returns An array of InboxItem objects.
 */
export function getInboxItems(): InboxItem[] {
    return [...inboxItems.filter(item => !item.processedAt)];
}

/**
 * Marks an inbox item as processed (e.g., converted to a task, project, or archived).
 * @param itemId - The ID of the item to mark as processed.
 */
export function processInboxItem(itemId: string): void {
    const item = inboxItems.find(i => i.id === itemId);
    if (item) {
        item.processedAt = new Date().toISOString();
        console.log(`GTD Inbox Item Processed (conceptual): ${itemId}`);
    }
}

/**
 * Clears all processed items from the inbox.
 * (Optional: or could just filter them out in getInboxItems)
 */
export function clearProcessedInboxItems(): void {
    inboxItems = inboxItems.filter(item => !item.processedAt);
    console.log('GTD Processed Inbox Items Cleared (conceptual)');
}

// _resetInboxStore for testing
export function _resetGTDInboxStore(): void {
    inboxItems = [];
}
