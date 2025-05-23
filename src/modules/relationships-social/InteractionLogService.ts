// src/modules/relationships-social/InteractionLogService.ts
import { InteractionLog, InteractionType } from './types';
import * as ContactService from './ContactService'; // Import ContactService to update lastContactedDate
import { v4 as uuidv4 } from 'uuid';

// In-memory store for interaction logs
let interactionLogs: InteractionLog[] = [];

/**
 * Logs a new interaction.
 * After logging, it updates the associated contact's lastContactedDate.
 * @param data - Object containing interaction details.
 * @returns The newly created InteractionLog object, or undefined if contact not found.
 */
export function logInteraction(data: Omit<InteractionLog, 'id' | 'createdAt'>): InteractionLog | undefined {
    // Ensure the contact exists before logging an interaction for it
    const contact = ContactService.getContact(data.contactId);
    if (!contact) {
        console.error(`InteractionLogService: Contact with ID ${data.contactId} not found. Cannot log interaction.`);
        return undefined;
    }

    const now = new Date().toISOString();
    const newLog: InteractionLog = {
        id: uuidv4(),
        ...data,
        createdAt: now,
    };
    interactionLogs.push(newLog);

    // Update the contact's lastContactedDate
    ContactService.updateContact(data.contactId, { lastContactedDate: data.date }); // Use interaction date for lastContacted

    return newLog;
}

/**
 * Retrieves an interaction log by its ID.
 * @param id - The ID of the interaction log.
 * @returns The InteractionLog object if found, otherwise undefined.
 */
export function getInteractionLog(id: string): InteractionLog | undefined {
    return interactionLogs.find(log => log.id === id);
}

/**
 * Updates an existing interaction log.
 * If the 'date' or 'contactId' of the interaction is changed, it also updates the
 * relevant contact's lastContactedDate accordingly.
 * @param id - The ID of the interaction log to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated InteractionLog object if found, otherwise undefined.
 */
export function updateInteractionLog(
    id: string,
    updates: Partial<Omit<InteractionLog, 'id' | 'createdAt'>>
): InteractionLog | undefined {
    const logIndex = interactionLogs.findIndex(log => log.id === id);
    if (logIndex === -1) {
        return undefined;
    }

    const originalLog = interactionLogs[logIndex];
    const updatedLog = { ...originalLog, ...updates };

    // Check if contactId or date changed, as this might affect lastContactedDate
    const contactIdForUpdate = updatedLog.contactId;
    let mustUpdateLastContacted = false;

    if (updates.date && updates.date !== originalLog.date) {
        mustUpdateLastContacted = true;
    }
    if (updates.contactId && updates.contactId !== originalLog.contactId) {
        // If contactId changed, the old contact's lastContactedDate might need recalculation
        // and the new contact's lastContactedDate needs to be set.
        // This is complex: requires finding all other interactions for the old contact.
        // For simplicity now, we'll just update the new contactId.
        // A more robust solution would re-evaluate lastContactedDate for originalLog.contactId.
        mustUpdateLastContacted = true; 
        // Potentially update old contact if this was its latest interaction
        // recalculateLastContactedDate(originalLog.contactId);
    }
    
    interactionLogs[logIndex] = updatedLog;

    if (mustUpdateLastContacted) {
        // This should ideally set it to the latest interaction date for that contact
        // For now, using the date of the interaction being updated/moved.
        // recalculateLastContactedDate(contactIdForUpdate);
        const contactInteractions = getInteractionsForContact(contactIdForUpdate, 'date'); // Get sorted interactions
        if (contactInteractions.length > 0) {
             ContactService.updateContact(contactIdForUpdate, { lastContactedDate: contactInteractions[0].date });
        } else {
             ContactService.updateContact(contactIdForUpdate, { lastContactedDate: undefined }); // No interactions left
        }
        if (originalLog.contactId !== contactIdForUpdate) { // If contact association changed
             const oldContactInteractions = getInteractionsForContact(originalLog.contactId, 'date');
             if (oldContactInteractions.length > 0) {
                ContactService.updateContact(originalLog.contactId, { lastContactedDate: oldContactInteractions[0].date });
             } else {
                ContactService.updateContact(originalLog.contactId, { lastContactedDate: undefined });
             }
        }

    }


    return updatedLog;
}


/**
 * Deletes an interaction log by its ID.
 * After deletion, it updates the associated contact's lastContactedDate.
 * @param id - The ID of the interaction log to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export function deleteInteractionLog(id: string): boolean {
    const logIndex = interactionLogs.findIndex(log => log.id === id);
    if (logIndex === -1) {
        return false;
    }
    const logToDelete = interactionLogs[logIndex];
    const contactId = logToDelete.contactId;

    interactionLogs.splice(logIndex, 1); // More efficient than filter for single removal

    // Update the contact's lastContactedDate to the date of the now latest interaction
    const remainingInteractions = getInteractionsForContact(contactId, 'date'); // Sorted by date desc
    if (remainingInteractions.length > 0) {
        ContactService.updateContact(contactId, { lastContactedDate: remainingInteractions[0].date });
    } else {
        ContactService.updateContact(contactId, { lastContactedDate: undefined }); // No interactions left
    }

    return true;
}

/**
 * Retrieves all interaction logs for a specific contact, optionally sorted.
 * @param contactId - The ID of the contact.
 * @param sortBy - Optional key of InteractionLog to sort by. Default: 'date' descending.
 * @returns An array of InteractionLog objects.
 */
export function getInteractionsForContact(
    contactId: string,
    sortBy: keyof InteractionLog = 'date'
): InteractionLog[] {
    const logs = interactionLogs.filter(log => log.contactId === contactId);
    logs.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];

        if (sortBy === 'date' || sortBy === 'createdAt') {
            return new Date(valB as string).getTime() - new Date(valA as string).getTime(); // Newest first
        }
        // Basic string/number comparison for other fields
        if (typeof valA === 'string' && typeof valB === 'string') { // Added this for robustness
            return valA.localeCompare(valB);
        }
        if (typeof valA === 'number' && typeof valB === 'number') { // Added this for robustness
             return valA - valB;
        }
        if (valA! < valB!) return -1;
        if (valA! > valB!) return 1;
        return 0;
    });
    return logs;
}

/**
 * Retrieves all interaction logs, optionally sorted.
 * @param sortBy - Optional key of InteractionLog to sort by. Default: 'date' descending.
 * @returns An array of all InteractionLog objects.
 */
export function getAllInteractionLogs(sortBy: keyof InteractionLog = 'date'): InteractionLog[] {
    const sortedLogs = [...interactionLogs];
    sortedLogs.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];

        if (sortBy === 'date' || sortBy === 'createdAt') {
            return new Date(valB as string).getTime() - new Date(valA as string).getTime(); // Newest first
        }
        // Basic string/number comparison for other fields
        if (typeof valA === 'string' && typeof valB === 'string') { // Added this for robustness
            return valA.localeCompare(valB);
        }
        if (typeof valA === 'number' && typeof valB === 'number') { // Added this for robustness
             return valA - valB;
        }
        if (valA! < valB!) return -1;
        if (valA! > valB!) return 1;
        return 0;
    });
    return sortedLogs;
}

// Helper function to reset the in-memory store, useful for testing
export function _resetInteractionLogsStore(): void {
    interactionLogs = [];
}

// Example Usage (for internal testing - requires ContactService to be usable)
/*
// Assumes ContactService and its store are available and populated for contactId1, contactId2
// ContactService._resetContactsStore();
// _resetInteractionLogsStore(); // Corrected to use its own reset
// const contactId1 = ContactService.addContact({ name: "Test Contact 1", email: "test1@example.com" }).id;
// const contactId2 = ContactService.addContact({ name: "Test Contact 2", email: "test2@example.com" }).id;

// logInteraction({ contactId: contactId1, date: new Date(2023, 0, 15).toISOString(), type: InteractionType.CALL, description: "Discussed project updates." });
// const interaction2 = logInteraction({ contactId: contactId1, date: new Date(2023, 0, 20).toISOString(), type: InteractionType.EMAIL, description: "Sent follow-up email." });
// logInteraction({ contactId: contactId2, date: new Date(2023, 0, 18).toISOString(), type: InteractionType.IN_PERSON_MEETING, description: "Met for coffee." });

// console.log("All Interactions for Contact 1:", getInteractionsForContact(contactId1));
// console.log("Contact 1 after interactions:", ContactService.getContact(contactId1)); // Check lastContactedDate

// if (interaction2) {
//    updateInteractionLog(interaction2.id, { description: "Sent crucial follow-up email regarding deadline."});
//    console.log("Updated interaction 2:", getInteractionLog(interaction2.id));
// }
// console.log("All Interactions (sorted by date):", getAllInteractionLogs());
// if (interaction2) {
//    deleteInteractionLog(interaction2.id);
//    console.log("Contact 1 after deleting one interaction:", ContactService.getContact(contactId1));
// }
*/
