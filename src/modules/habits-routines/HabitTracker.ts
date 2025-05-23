// src/modules/habits-routines/HabitTracker.ts
import { Vault, TFile, moment, FrontMatterCache } from 'obsidian';

interface HabitFrontmatter {
    habits?: Record<string, boolean | string>; // string for 'completed', 'skipped' etc.
}

export interface HabitCompletionData {
    habitName: string;
    datesCompleted: string[]; // Dates in 'YYYY-MM-DD' format
}

export interface HabitStreakInfo {
    habitName: string;
    currentStreak: number;
    longestStreak: number;
    // Optional: datesCompleted?: string[]; // For debugging or more detailed display
}

/**
 * Scans daily notes from the last `periodInDays` to extract habit completion status.
 * Assumes daily notes are in a 'daily/' folder and named 'YYYY-MM-DD.md'.
 * Assumes habits are in YAML frontmatter under the 'habits' key,
 * with habit names as keys and boolean `true` indicating completion.
 */
export async function getHabitData(vault: Vault, periodInDays: number): Promise<HabitCompletionData[]> {
    const allHabitsMap: Map<string, string[]> = new Map(); // Map<habitName, datesCompleted[]>
    const today = moment();

    for (let i = 0; i < periodInDays; i++) {
        const dateToScan = today.clone().subtract(i, 'days');
        const dateStr = dateToScan.format('YYYY-MM-DD');
        // This path assumption might need to be configurable in a real plugin
        const dailyNotePath = `daily/${dateStr}.md`; 
        
        const file = vault.getAbstractFileByPath(dailyNotePath);
        if (file instanceof TFile) {
            try {
                const fileCache = await vault.metadataCache.getFileCache(file);
                const frontmatter = fileCache?.frontmatter as HabitFrontmatter | undefined;

                if (frontmatter && frontmatter.habits && typeof frontmatter.habits === 'object') {
                    for (const habitName in frontmatter.habits) {
                        // We consider a habit completed if its value is exactly true.
                        // Other truthy values like "completed", "done" could be supported here
                        // by checking against a list of positive strings.
                        if (frontmatter.habits[habitName] === true) {
                            if (!allHabitsMap.has(habitName)) {
                                allHabitsMap.set(habitName, []);
                            }
                            // Store dates in a consistent format, ensure no duplicates if script runs multiple times on same day for some reason
                            const datesList = allHabitsMap.get(habitName)!;
                            if (!datesList.includes(dateStr)) {
                                datesList.push(dateStr);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing daily note ${dailyNotePath}:`, error);
                // Continue to next file
            }
        }
    }

    // Convert map to array and sort dates for each habit
    const result: HabitCompletionData[] = [];
    for (const [habitName, dates] of allHabitsMap.entries()) {
        dates.sort((a, b) => moment(a, 'YYYY-MM-DD').diff(moment(b, 'YYYY-MM-DD'))); // Ascending sort
        result.push({ habitName, datesCompleted: dates });
    }
    return result;
}

/**
 * Calculates current and longest streaks for habits.
 */
export async function calculateStreaks(habitData: HabitCompletionData[]): Promise<HabitStreakInfo[]> {
    const results: HabitStreakInfo[] = [];
    const todayMoment = moment().startOf('day'); // Use start of day for consistent comparison

    for (const habit of habitData) {
        if (habit.datesCompleted.length === 0) {
            results.push({ habitName: habit.habitName, currentStreak: 0, longestStreak: 0 });
            continue;
        }

        // Ensure dates are sorted chronologically (YYYY-MM-DD format sorts well as strings)
        const sortedDates = [...habit.datesCompleted].sort();
        
        let currentStreak = 0;
        let longestStreak = 0;
        let localCurrentStreak = 0;

        // Calculate longest streak
        for (let i = 0; i < sortedDates.length; i++) {
            const dateMoment = moment(sortedDates[i], 'YYYY-MM-DD').startOf('day');
            if (i === 0) {
                localCurrentStreak = 1;
            } else {
                const prevDateMoment = moment(sortedDates[i-1], 'YYYY-MM-DD').startOf('day');
                if (dateMoment.diff(prevDateMoment, 'days') === 1) {
                    localCurrentStreak++;
                } else {
                    // Streak broken
                    localCurrentStreak = 1;
                }
            }
            if (localCurrentStreak > longestStreak) {
                longestStreak = localCurrentStreak;
            }
        }

        // Calculate current streak (up to today or yesterday)
        // Reset localCurrentStreak for this calculation
        localCurrentStreak = 0; 
        let lastStreakDate: moment.Moment | null = null;

        for (let i = sortedDates.length - 1; i >= 0; i--) {
            const dateMoment = moment(sortedDates[i], 'YYYY-MM-DD').startOf('day');
            
            if (lastStreakDate === null) { // First date in reverse iteration
                // Check if this date is today or yesterday to start a potential current streak
                if (dateMoment.isSame(todayMoment, 'day') || dateMoment.isSame(todayMoment.clone().subtract(1, 'day'), 'day')) {
                    localCurrentStreak = 1;
                    lastStreakDate = dateMoment;
                } else {
                    // Last completed date is too old, current streak is 0
                    break; 
                }
            } else {
                // Check if this date is consecutive to the lastStreakDate
                if (lastStreakDate.diff(dateMoment, 'days') === 1) {
                    localCurrentStreak++;
                    lastStreakDate = dateMoment;
                } else {
                    // Streak broken before reaching further back
                    break;
                }
            }
        }
        
        // If the most recent completion was not today, the current streak is 0
        // unless it was yesterday and the loop correctly counted it.
        // The current logic: if the last completion date is not today, the streak is only valid if it ended yesterday.
        // If the last completed date is not today, and not yesterday, current streak is 0.
        if (lastStreakDate && !lastStreakDate.isSame(todayMoment, 'day')) {
             // If loop ended and last streak date wasn't today, it means today was missed.
             // If lastStreakDate was yesterday, localCurrentStreak is correct.
             // If lastStreakDate was older than yesterday, it means the streak is broken.
             if (!lastStreakDate.isSame(todayMoment.clone().subtract(1, 'day'), 'day')) {
                 currentStreak = 0; // Streak did not continue to today or yesterday
             } else {
                 currentStreak = localCurrentStreak; // Streak ended yesterday
             }
        } else if (lastStreakDate && lastStreakDate.isSame(todayMoment, 'day')) {
            currentStreak = localCurrentStreak; // Streak includes today
        } else {
             currentStreak = 0; // No recent completions
        }


        results.push({ 
            habitName: habit.habitName, 
            currentStreak, 
            longestStreak
            // datesCompleted: sortedDates // For debugging
        });
    }
    return results;
}
