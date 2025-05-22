// src/modules/journaling-reflection/MoodService.ts
import { Mood, MoodLog } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory stores
let moodDefinitions: Mood[] = [];
let moodLogs: MoodLog[] = [];

// --- Mood Definition Management ---

/**
 * Adds a new mood definition to the system.
 * @param name - The name of the mood (e.g., "Happy", "Productive").
 * @param color - Optional hex color code for UI representation.
 * @returns The newly created Mood object.
 */
export function addMoodDefinition(name: string, color?: string): Mood {
    const newMoodDefinition: Mood = {
        id: uuidv4(),
        name,
        color,
    };
    moodDefinitions.push(newMoodDefinition);
    return newMoodDefinition;
}

/**
 * Retrieves a mood definition by its ID.
 * @param id - The ID of the mood definition.
 * @returns The Mood object if found, otherwise undefined.
 */
export function getMoodDefinition(id: string): Mood | undefined {
    return moodDefinitions.find(m => m.id === id);
}

/**
 * Retrieves all defined moods.
 * @returns An array of all Mood objects.
 */
export function getAllMoodDefinitions(): Mood[] {
    return [...moodDefinitions];
}

// --- Mood Log Management ---

/**
 * Logs an instance of a mood.
 * @param moodId - The ID of the Mood being logged.
 * @param intensity - Optional intensity rating (e.g., 1-5).
 * @param notes - Optional notes about the mood.
 * @returns The newly created MoodLog object.
 */
export function logMood(moodId: string, intensity?: number, notes?: string): MoodLog | undefined {
    // Ensure the moodId corresponds to a defined mood
    if (!getMoodDefinition(moodId)) {
        console.error(`MoodService: Attempted to log mood with invalid moodId: ${moodId}`);
        return undefined;
    }
    const newLog: MoodLog = {
        id: uuidv4(),
        date: new Date().toISOString(), // Current date and time in UTC
        moodId,
        intensity,
        notes,
    };
    moodLogs.push(newLog);
    return newLog;
}

/**
 * Retrieves a specific mood log by its ID.
 * @param id - The ID of the mood log.
 * @returns The MoodLog object if found, otherwise undefined.
 */
export function getMoodLog(id: string): MoodLog | undefined {
    return moodLogs.find(log => log.id === id);
}

/**
 * Updates an existing mood log.
 * Only provided fields (intensity, notes) can be updated.
 * @param id - The ID of the mood log to update.
 * @param updates - An object containing 'intensity' and/or 'notes'.
 * @returns The updated MoodLog object if found, otherwise undefined.
 */
export function updateMoodLog(
    id: string,
    updates: Partial<Pick<MoodLog, 'intensity' | 'notes' | 'moodId'>>
): MoodLog | undefined {
    const logIndex = moodLogs.findIndex(log => log.id === id);
    if (logIndex === -1) {
        return undefined;
    }
    // Ensure moodId is valid if it's being updated
    if (updates.moodId && !getMoodDefinition(updates.moodId)) {
        console.error(`MoodService: Attempted to update mood log with invalid moodId: ${updates.moodId}`);
        return undefined;
    }
    moodLogs[logIndex] = { ...moodLogs[logIndex], ...updates };
    return moodLogs[logIndex];
}

/**
 * Deletes a mood log by its ID.
 * @param id - The ID of the mood log to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export function deleteMoodLog(id: string): boolean {
    const initialLength = moodLogs.length;
    moodLogs = moodLogs.filter(log => log.id !== id);
    return moodLogs.length < initialLength;
}

/**
 * Retrieves mood logs based on date components and/or moodId.
 * @param filter - An object with optional date components and/or moodId.
 *                 - date: Full ISO date string (YYYY-MM-DD) to match the date part.
 *                 - day: Day of the month (1-31).
 *                 - month: Month (1-12).
 *                 - year: Year (e.g., 2023).
 *                 - moodId: Filter by a specific mood ID.
 * @returns An array of MoodLog objects matching the filter, sorted by date descending.
 */
export function getMoodLogs(
    filter: { date?: string; day?: number; month?: number; year?: number; moodId?: string } = {}
): MoodLog[] {
    let filtered = moodLogs;

    if (filter.moodId) {
        filtered = filtered.filter(log => log.moodId === filter.moodId);
    }
    if (filter.date) {
        filtered = filtered.filter(log => log.date.startsWith(filter.date));
    }
    if (filter.year) {
        filtered = filtered.filter(log => new Date(log.date).getFullYear() === filter.year);
    }
    if (filter.month) { // 1-12 for month
        filtered = filtered.filter(log => (new Date(log.date).getMonth() + 1) === filter.month);
    }
    if (filter.day) { // 1-31 for day
        filtered = filtered.filter(log => new Date(log.date).getDate() === filter.day);
    }

    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Retrieves all mood logs, sorted by date descending (newest first).
 * @returns An array of all MoodLog objects.
 */
export function getAllMoodLogsSorted(): MoodLog[] {
    return [...moodLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


// Helper to initialize with default mood definitions
export function _initializeMoodDefinitions() {
    moodDefinitions = []; // Clear existing
    addMoodDefinition("Happy", "#FFD700");      // Gold
    addMoodDefinition("Sad", "#ADD8E6");        // Light Blue
    addMoodDefinition("Productive", "#90EE90"); // Light Green
    addMoodDefinition("Anxious", "#FFA07A");     // Light Salmon
    addMoodDefinition("Calm", "#B0E0E6");       // Powder Blue
    addMoodDefinition("Excited", "#FFB6C1");     // Light Pink
    addMoodDefinition("Tired", "#D3D3D3");       // Light Grey
}

// Helper functions to reset stores, useful for testing
export function _resetMoodDefinitionsStore() {
    moodDefinitions = [];
}
export function _resetMoodLogsStore() {
    moodLogs = [];
}


// Initialize with default mood definitions when the module loads
_initializeMoodDefinitions();

// Example Usage (for internal testing if needed)
/*
console.log("All Mood Definitions:", getAllMoodDefinitions());
const happyMood = moodDefinitions.find(m => m.name === "Happy");
if (happyMood) {
    const log1 = logMood(happyMood.id, 5, "Feeling great after a good workout!");
    console.log("Logged Mood:", log1);
}
const productiveMood = moodDefinitions.find(m => m.name === "Productive");
if (productiveMood) {
    logMood(productiveMood.id, 4, "Finished a big project task.");
}
console.log("All Mood Logs (Sorted):", getAllMoodLogsSorted());
if (happyMood) {
    console.log("Happy Mood Logs for today:", getMoodLogs({ moodId: happyMood.id, date: new Date().toISOString().split('T')[0]}));
}
*/
