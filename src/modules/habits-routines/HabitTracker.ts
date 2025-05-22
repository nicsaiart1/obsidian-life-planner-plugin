// src/modules/habits-routines/HabitTracker.ts
import { Habit, HabitFrequency } from './types'; // Assuming types.ts is in the same directory
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// In-memory store for habits
let habits: Habit[] = [];

/**
 * Generates a simple ISO date string (YYYY-MM-DD) from a Date object.
 */
function getISODateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Adds a new habit to the in-memory store.
 */
export function addHabit(
    name: string,
    description: string | undefined,
    frequency: HabitFrequency,
    target?: number,
    targetUnit?: string
): Habit {
    const newHabit: Habit = {
        id: uuidv4(),
        name,
        description,
        frequency,
        target,
        targetUnit,
        streak: 0,
        lastCompletedDate: undefined,
        createdAt: getISODateString(new Date()),
    };
    habits.push(newHabit);
    return newHabit;
}

/**
 * Retrieves a habit by its ID.
 */
export function getHabit(id: string): Habit | undefined {
    return habits.find(h => h.id === id);
}

/**
 * Updates an existing habit.
 * Only provided fields will be updated.
 */
export function updateHabit(id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>): Habit | undefined {
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) {
        return undefined;
    }
    habits[habitIndex] = { ...habits[habitIndex], ...updates };
    return habits[habitIndex];
}

/**
 * Deletes a habit by its ID.
 * Returns true if deletion was successful, false otherwise.
 */
export function deleteHabit(id: string): boolean {
    const initialLength = habits.length;
    habits = habits.filter(h => h.id !== id);
    return habits.length < initialLength;
}

/**
 * Marks a habit as complete for a given date.
 * Updates streak and lastCompletedDate.
 */
export function markHabitComplete(id: string, completionDate: Date = new Date()): Habit | undefined {
    const habit = getHabit(id);
    if (!habit) {
        return undefined;
    }

    const completionDateString = getISODateString(completionDate);

    // Avoid double marking for the same day or marking for a future date
    if (completionDateString === habit.lastCompletedDate || completionDate > new Date()) {
        // Potentially return an error or specific status if already completed today
        // For now, just return the habit as is or undefined if no change
        return habit; 
    }
    
    // Streak logic (simplified):
    // Increment streak if completed on consecutive days based on frequency.
    // This is a basic implementation. Real streak logic can be complex depending on frequency.
    // For daily habits:
    if (habit.frequency.type === 'daily') {
        if (habit.lastCompletedDate) {
            const lastDate = new Date(habit.lastCompletedDate);
            const today = new Date(completionDateString); // Use completionDateString for today's date part
            
            // Check if yesterday was the last completed date
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            if (getISODateString(yesterday) === getISODateString(lastDate)) {
                habit.streak += 1;
            } else {
                // Reset streak if not consecutive (and not the very first completion)
                habit.streak = 1;
            }
        } else {
            // First time completing
            habit.streak = 1;
        }
    } else {
        // For other frequencies (weekly, monthly, specific_days),
        // a more sophisticated check is needed to see if it's a "consecutive" period.
        // For now, we'll just increment if it's a new completion.
        // A more robust solution would involve checking against the expected completion schedule.
        habit.streak +=1; 
    }


    habit.lastCompletedDate = completionDateString;
    return updateHabit(id, { streak: habit.streak, lastCompletedDate: habit.lastCompletedDate });
}

/**
 * Retrieves all habits.
 * Optionally, implement filtering logic here later.
 */
export function getAllHabits(): Habit[] {
    return [...habits]; // Return a copy to prevent direct modification
}

/**
 * Retrieves habits due for today.
 * This is a simplified version. A more robust implementation would consider:
 * - Habit frequency (daily, weekly on specific day, monthly on specific day)
 * - Last completed date
 */
export function getHabitsDueToday(): Habit[] {
    const today = new Date();
    const todayString = getISODateString(today);
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.

    return habits.filter(habit => {
        if (habit.lastCompletedDate === todayString) {
            return false; // Already completed today
        }

        switch (habit.frequency.type) {
            case 'daily':
                return true;
            case 'weekly':
                // Check if the current day is one of the specified days
                // and if the interval matches (e.g., every week, every 2 weeks)
                // This simplified version checks if today is a target day, assuming interval of 1
                return habit.frequency.days?.includes(dayOfWeek);
            case 'specific_days':
                return habit.frequency.days?.includes(dayOfWeek);
            // 'monthly' would require checking day of the month, more complex.
            // For now, not including monthly in "due today" unless it's specifically handled.
            default:
                return false;
        }
    });
}

// Helper function to reset the in-memory store, useful for testing
export function _resetHabitsStore() {
    habits = [];
}

// Example usage (optional, for testing within the file if run directly)
/*
addHabit("Drink Water", "Drink 8 glasses of water", { type: 'daily' }, 8, "glasses");
addHabit("Exercise", "Go for a run", { type: 'specific_days', days: [1, 3, 5] }); // Mon, Wed, Fri
console.log(getAllHabits());
const waterHabit = habits.find(h => h.name === "Drink Water");
if (waterHabit) {
    markHabitComplete(waterHabit.id);
    console.log(getHabit(waterHabit.id));
    // Simulate completing yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() -1);
    waterHabit.lastCompletedDate = getISODateString(yesterday);
    waterHabit.streak = 1; // manually set for testing next completion
    updateHabit(waterHabit.id, {lastCompletedDate: waterHabit.lastCompletedDate, streak: waterHabit.streak});
    markHabitComplete(waterHabit.id); // Mark for today
    console.log(getHabit(waterHabit.id));


}
console.log("Due today:", getHabitsDueToday());
*/
