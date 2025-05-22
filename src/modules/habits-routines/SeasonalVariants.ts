// src/modules/habits-routines/SeasonalVariants.ts
import type { Habit } from './types';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * Determines the current season based on the date and hemisphere (optional).
 * This is a simplified example.
 * 
 * @param date - The date to determine the season for.
 * @param hemisphere - 'northern' or 'southern'. Defaults to 'northern'.
 * @returns The current season.
 */
export function getCurrentSeason(date: Date = new Date(), hemisphere: 'northern' | 'southern' = 'northern'): Season {
    const month = date.getMonth(); // 0-11
    // Simplified Northern Hemisphere example:
    if (hemisphere === 'northern') {
        if (month >= 2 && month <= 4) return 'spring'; // Mar-May
        if (month >= 5 && month <= 7) return 'summer'; // Jun-Aug
        if (month >= 8 && month <= 10) return 'autumn'; // Sep-Nov
        return 'winter'; // Dec-Feb
    } else {
        // Simplified Southern Hemisphere example:
        if (month >= 8 && month <= 10) return 'spring'; // Sep-Nov
        if (month >= 11 || month <= 1) return 'summer'; // Dec-Feb
        if (month >= 2 && month <= 4) return 'autumn'; // Mar-May
        return 'winter'; // Jun-Aug
    }
}

/**
 * Modifies a habit based on seasonal variations.
 * For example, an outdoor running habit might change to an indoor gym habit in winter.
 * This function would define how a habit's properties (name, description, target) might change.
 * 
 * This is a conceptual placeholder. The actual implementation would depend on how
 * seasonal variants are defined and stored (e.g., as part of the Habit object,
 * or in separate configuration).
 * 
 * @param habit - The original habit.
 * @param season - The current season.
 * @returns A new Habit object representing the seasonal variant, or the original habit if no variant applies.
 */
export function applySeasonalVariant(habit: Habit, season?: Season): Habit {
    const currentSeason = season || getCurrentSeason();
    let modifiedHabit = { ...habit };

    // TODO: Implement logic to apply seasonal variants.
    // This is highly dependent on how variants are defined.
    // Example:
    // if (habit.name === "Outdoor Run" && currentSeason === "winter") {
    //   modifiedHabit.name = "Indoor Gym Session";
    //   modifiedHabit.description = "Go to the gym due to cold weather.";
    // } else if (habit.name === "Gardening" && (currentSeason === "winter" || currentSeason === "autumn")) {
    //   modifiedHabit.name = "Indoor Plant Care";
    //   modifiedHabit.description = "Tend to indoor plants.";
    // }
    
    console.log(`Conceptual: Apply seasonal variant for habit "${habit.name}" during ${currentSeason}. Current name: ${modifiedHabit.name}`);
    return modifiedHabit;
}

/**
 * Checks if a habit has a defined variant for the current season.
 * 
 * @param habitId - The ID of the habit to check.
 * @param season - The current season.
 * @returns True if a variant exists, false otherwise.
 */
export function hasSeasonalVariant(habitId: string, season?: Season): boolean {
    // TODO: Implement logic to check for defined seasonal variants.
    // This would likely involve fetching the habit and its variant configurations.
    const currentSeason = season || getCurrentSeason();
    console.log(`Conceptual: Check seasonal variant for habit ID "${habitId}" during ${currentSeason}.`);
    return false; // Placeholder
}
