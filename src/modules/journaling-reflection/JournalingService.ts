// src/modules/journaling-reflection/JournalingService.ts
import { JournalEntry } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for journal entries
let journalEntries: JournalEntry[] = [];

/**
 * Creates a new journal entry and saves it to the in-memory store.
 * @param title - Optional title for the journal entry.
 * @param content - The markdown content of the journal entry.
 * @param promptId - Optional ID of the prompt used.
 * @param moodLogId - Optional ID of the mood log associated.
 * @returns The newly created JournalEntry object.
 */
export function createJournalEntry(
    content: string,
    title?: string,
    promptId?: string,
    moodLogId?: string
): JournalEntry {
    const newEntry: JournalEntry = {
        id: uuidv4(),
        date: new Date().toISOString(), // Current date and time in UTC
        title,
        content,
        promptId,
        moodLogId,
    };
    journalEntries.push(newEntry);
    return newEntry;
}

/**
 * Retrieves a journal entry by its ID.
 * @param id - The ID of the journal entry to retrieve.
 * @returns The JournalEntry object if found, otherwise undefined.
 */
export function getJournalEntry(id: string): JournalEntry | undefined {
    return journalEntries.find(entry => entry.id === id);
}

/**
 * Updates an existing journal entry.
 * Only provided fields will be updated.
 * @param id - The ID of the journal entry to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated JournalEntry object if found and updated, otherwise undefined.
 */
export function updateJournalEntry(
    id: string,
    updates: Partial<Omit<JournalEntry, 'id' | 'date'>> // Cannot update id or original date via this method
): JournalEntry | undefined {
    const entryIndex = journalEntries.findIndex(entry => entry.id === id);
    if (entryIndex === -1) {
        return undefined;
    }
    journalEntries[entryIndex] = { ...journalEntries[entryIndex], ...updates };
    return journalEntries[entryIndex];
}

/**
 * Deletes a journal entry by its ID.
 * @param id - The ID of the journal entry to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export function deleteJournalEntry(id: string): boolean {
    const initialLength = journalEntries.length;
    journalEntries = journalEntries.filter(entry => entry.id !== id);
    return journalEntries.length < initialLength;
}

/**
 * Retrieves journal entries based on date components.
 * @param filter - An object with optional date components.
 *                 If no filter or empty filter is provided, returns all entries.
 *                 - date: Full ISO date string (YYYY-MM-DD) to match the date part.
 *                 - day: Day of the month (1-31).
 *                 - month: Month (1-12).
 *                 - year: Year (e.g., 2023).
 * @returns An array of JournalEntry objects matching the filter.
 */
export function getJournalEntries(
    filter: { date?: string; day?: number; month?: number; year?: number } = {}
): JournalEntry[] {
    if (!filter || Object.keys(filter).length === 0) {
        return [...journalEntries]; // Return all entries if no filter
    }

    return journalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        let match = true;

        if (filter.date) {
            match = match && entry.date.startsWith(filter.date);
        }
        if (filter.year) {
            match = match && entryDate.getFullYear() === filter.year;
        }
        if (filter.month) { // 1-12 for month
            match = match && (entryDate.getMonth() + 1) === filter.month;
        }
        if (filter.day) { // 1-31 for day
            match = match && entryDate.getDate() === filter.day;
        }
        return match;
    });
}

/**
 * Retrieves all journal entries, sorted by date descending (newest first).
 * @returns An array of all JournalEntry objects.
 */
export function getAllJournalEntriesSorted(): JournalEntry[] {
    return [...journalEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


// Helper function to reset the in-memory store, useful for testing
export function _resetJournalEntriesStore() {
    journalEntries = [];
}

// Example Usage (for internal testing if needed)
/*
_resetJournalEntriesStore();
createJournalEntry("This is my first journal entry!", "First Entry");
const secondEntry = createJournalEntry("Feeling productive today.", "Productivity Log");
createJournalEntry("A quick note about my day.", "Daily Note", undefined, "moodLogId123");

console.log("All Entries (Sorted):", getAllJournalEntriesSorted());
if (secondEntry) {
    updateJournalEntry(secondEntry.id, { content: "Feeling very productive and accomplished today!" });
    console.log("Updated Second Entry:", getJournalEntry(secondEntry.id));
}
console.log("Entries from today:", getJournalEntries({ date: new Date().toISOString().split('T')[0] }));
*/
