// src/modules/habits-routines/RoutineBuilder.ts
import { Routine, RoutineSchedule } from './types'; // Assuming types.ts is in the same directory
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
// Potentially import Habit-related functions if needed for validation, e.g., from HabitTracker.ts
// import { getHabit } from './HabitTracker';

// In-memory store for routines
let routines: Routine[] = [];

/**
 * Generates a simple ISO date string (YYYY-MM-DD) from a Date object.
 */
function getISODateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Adds a new routine to the in-memory store.
 */
export function addRoutine(
    name: string,
    description: string | undefined,
    habitIds: string[],
    schedule?: RoutineSchedule
): Routine {
    const newRoutine: Routine = {
        id: uuidv4(),
        name,
        description,
        habitIds,
        schedule,
        createdAt: getISODateString(new Date()),
    };
    routines.push(newRoutine);
    return newRoutine;
}

/**
 * Retrieves a routine by its ID.
 */
export function getRoutine(id: string): Routine | undefined {
    return routines.find(r => r.id === id);
}

/**
 * Updates an existing routine.
 * Only provided fields will be updated.
 */
export function updateRoutine(id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>): Routine | undefined {
    const routineIndex = routines.findIndex(r => r.id === id);
    if (routineIndex === -1) {
        return undefined;
    }
    routines[routineIndex] = { ...routines[routineIndex], ...updates };
    return routines[routineIndex];
}

/**
 * Deletes a routine by its ID.
 * Returns true if deletion was successful, false otherwise.
 */
export function deleteRoutine(id: string): boolean {
    const initialLength = routines.length;
    routines = routines.filter(r => r.id !== id);
    return routines.length < initialLength;
}

/**
 * Adds a habit to a routine.
 * Ensures habit ID is not already in the routine.
 */
export function addHabitToRoutine(routineId: string, habitId: string): Routine | undefined {
    const routine = getRoutine(routineId);
    if (!routine) {
        // Consider if we should validate habitId exists using getHabit(habitId)
        // For now, we'll assume habitId is valid if routine exists
        return undefined; 
    }

    if (!routine.habitIds.includes(habitId)) {
        routine.habitIds.push(habitId);
        return updateRoutine(routineId, { habitIds: routine.habitIds });
    }
    return routine; // Habit already in routine
}

/**
 * Removes a habit from a routine.
 */
export function removeHabitFromRoutine(routineId: string, habitId: string): Routine | undefined {
    const routine = getRoutine(routineId);
    if (!routine) {
        return undefined;
    }

    const initialLength = routine.habitIds.length;
    routine.habitIds = routine.habitIds.filter(id => id !== habitId);

    if (routine.habitIds.length < initialLength) {
        return updateRoutine(routineId, { habitIds: routine.habitIds });
    }
    return routine; // Habit not found in routine
}

/**
 * Retrieves all routines.
 * Optionally, implement filtering logic here later.
 */
export function getAllRoutines(): Routine[] {
    return [...routines]; // Return a copy to prevent direct modification
}

// Helper function to reset the in-memory store, useful for testing
export function _resetRoutinesStore() {
    routines = [];
}

// Example usage (optional, for testing)
/*
const routine1 = addRoutine(
    "Morning Kickstart", 
    "My main morning routine", 
    [], // Start with no habits
    { type: 'daily', time: '07:00' }
);
console.log(getAllRoutines());

if (routine1) {
    // Assume some habit IDs exist from HabitTracker module
    const habitId1 = "mockHabitId1"; // Replace with actual ID if testing with HabitTracker
    const habitId2 = "mockHabitId2";
    
    addHabitToRoutine(routine1.id, habitId1);
    addHabitToRoutine(routine1.id, habitId2);
    console.log(getRoutine(routine1.id));

    removeHabitFromRoutine(routine1.id, habitId1);
    console.log(getRoutine(routine1.id));
}
*/
