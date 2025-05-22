// src/modules/time-management/TaskRecurrenceEngine.ts

export type Frequency = "daily" | "weekly" | "monthly" | "yearly"; // Yearly is for future
export type DayOfWeek = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA"; // Sunday to Saturday

const DAY_OF_WEEK_MAP: DayOfWeek[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const DAY_OF_WEEK_TO_NUMBER: { [key in DayOfWeek]: number } = {
    "SU": 0, "MO": 1, "TU": 2, "WE": 3, "TH": 4, "FR": 5, "SA": 6
};

export interface RecurrenceRule {
    frequency: Frequency;
    interval: number; // e.g., 1 for every period, 2 for every other
    days_of_week?: DayOfWeek[]; // For weekly frequency
    day_of_month?: number;    // For monthly frequency (e.g., 15)
    start_date: string;       // ISO Date string "YYYY-MM-DD"
    end_date?: string;        // Optional ISO Date string "YYYY-MM-DD"
}

export interface RecurringTask {
    id: string;
    title: string;
    due_date?: string | null;          // ISO Date string "YYYY-MM-DD" - current due date
    completion_date?: string | null; // ISO Date string "YYYY-MM-DD" - last completion
    recurrence_rule?: RecurrenceRule | null;
}

// --- Date Helper Functions ---

/**
 * Parses an ISO "YYYY-MM-DD" string into a Date object at UTC midnight.
 */
function parseISODate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a Date object into an "YYYY-MM-DD" string, using UTC components.
 */
function formatISODate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Adds a specified number of days to a date.
 */
function addDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setUTCDate(date.getUTCDate() + days);
    return result;
}

/**
 * Adds a specified number of weeks to a date.
 */
function addWeeks(date: Date, weeks: number): Date {
    return addDays(date, weeks * 7);
}

/**
 * Adds a specified number of months to a date.
 */
function addMonths(date: Date, months: number): Date {
    const result = new Date(date.getTime());
    const originalDay = result.getUTCDate();
    result.setUTCMonth(result.getUTCMonth() + months);
    if (result.getUTCDate() !== originalDay) {
        result.setUTCDate(0); 
    }
    return result;
}

/**
 * Gets the day of the week as a DayOfWeek string ("SU", "MO", etc.).
 */
function getDayOfWeekName(date: Date): DayOfWeek {
    return DAY_OF_WEEK_MAP[date.getUTCDay()];
}

/**
 * Gets the number of days in a given month (UTC).
 */
function getDaysInMonth(year: number, month: number): number { // month is 0-indexed
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// --- Core Recurrence Logic ---

export function calculateNextDueDate(task: RecurringTask, fromReferenceDateInput?: Date): Date | null {
    if (!task.recurrence_rule) {
        return null;
    }

    const rule = task.recurrence_rule;
    const today = new Date();
    const fromReferenceDate = fromReferenceDateInput ? 
        parseISODate(formatISODate(fromReferenceDateInput)) : // Strip time, use UTC midnight
        parseISODate(formatISODate(today));                  // Strip time, use UTC midnight


    const ruleStartDate = parseISODate(rule.start_date);
    const ruleEndDate = rule.end_date ? parseISODate(rule.end_date) : null;

    if (ruleEndDate && fromReferenceDate > ruleEndDate) {
        return null; 
    }

    let calculationBaseDate: Date;
    const taskDueDate = task.due_date ? parseISODate(task.due_date) : null;
    const taskCompletionDate = task.completion_date ? parseISODate(task.completion_date) : null;

    if (taskCompletionDate) {
        calculationBaseDate = taskCompletionDate;
    } else if (taskDueDate) {
        calculationBaseDate = taskDueDate;
    } else {
        calculationBaseDate = ruleStartDate;
    }
    
    // If calculationBaseDate is before ruleStartDate, we should start calculations from ruleStartDate,
    // but we want the *next* occurrence *after* that. So, effectively, the day before ruleStartDate.
    if (calculationBaseDate < ruleStartDate) {
        calculationBaseDate = addDays(ruleStartDate, -1); // So that ruleStartDate itself can be a candidate
    }
    
    // The next due date must be strictly after the calculationBaseDate.
    // It must also be on or after the fromReferenceDate.
    
    let nextDueDate: Date | null = null;
    let candidateDate = new Date(calculationBaseDate.getTime()); // Clone

    for (let i = 0; i < 1000; i++) { // Safety break for ~3 years of daily, or many more for sparse
        let tempNextDate: Date | null = null;

        switch (rule.frequency) {
            case "daily":
                tempNextDate = addDays(candidateDate, rule.interval);
                break;

            case "weekly":
                const currentDayOfCandidate = candidateDate.getUTCDay(); // 0-6 Sunday-Saturday
                if (rule.days_of_week && rule.days_of_week.length > 0) {
                    const targetDayNumbers = rule.days_of_week.map(d => DAY_OF_WEEK_TO_NUMBER[d]).sort((a, b) => a - b);
                    
                    let daysToAdvance = Infinity;
                    // Find the next valid day in the current week or subsequent weeks based on interval
                    for (const targetDay of targetDayNumbers) {
                        let diff = targetDay - currentDayOfCandidate;
                        if (diff > 0) { // Target day is later in the current week
                            daysToAdvance = Math.min(daysToAdvance, diff);
                        }
                    }

                    if (daysToAdvance === Infinity) { // All target days are past in the current week or same day
                        // Move to the first target day of the next interval week
                        daysToAdvance = (7 - currentDayOfCandidate) + targetDayNumbers[0] + (rule.interval -1) * 7;
                    } else {
                        // If the found day is today (diff=0), and it's part of the current iteration,
                        // we need to ensure we jump to the *next* interval if this is the base.
                        // This is handled by the loop and candidateDate update.
                        // The crucial part is that `candidateDate` is updated each loop.
                        // If candidateDate itself was a valid day, the next one will be in `rule.interval` weeks.
                    }
                    tempNextDate = addDays(candidateDate, daysToAdvance);
                    
                    // Check if candidateDate itself matched, and if so, advance by interval
                    // This logic is tricky. Let's simplify: find the first valid day AFTER candidateDate.
                    // If candidateDate itself was a valid day, we need to find the next one in the sequence.
                    
                    let searchDate = new Date(candidateDate.getTime());
                    for(let k=0; k < 7 * rule.interval + 7; k++) { // Search a bit more than one interval cycle
                        searchDate = addDays(candidateDate, k + 1); // Start searching from day AFTER candidateDate
                        const searchDayName = getDayOfWeekName(searchDate);
                        if (rule.days_of_week.includes(searchDayName)) {
                            // Check if this week is an "interval week"
                            // This requires comparing weeks since ruleStartDate or a known anchor point.
                            // For simplicity: if the rule.start_date's week has this day, then it's valid if interval is 1.
                            // A more robust way: calculate weeks passed since ruleStartDate's week.
                            const weeksSinceRuleStart = Math.floor((searchDate.getTime() - ruleStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                            if (weeksSinceRuleStart % rule.interval === 0) {
                                tempNextDate = searchDate;
                                break;
                            }
                        }
                    }


                } else { // No days_of_week specified, use start_date's day of week
                    tempNextDate = addWeeks(candidateDate, rule.interval);
                    // Ensure it lands on the same day of week as ruleStartDate
                    const ruleStartDay = ruleStartDate.getUTCDay();
                    const tempNextDay = tempNextDate.getUTCDay();
                    if (ruleStartDay !== tempNextDay) {
                        tempNextDate = addDays(tempNextDate, ruleStartDay - tempNextDay);
                        // If this adjustment moved it to the previous week, add 7 days.
                        // This is unlikely with addWeeks but good to be aware of.
                        // A simpler approach for this case:
                        // Start from candidateDate, find next occurrence of ruleStartDate's day of week, then check interval.
                        // For now, the addWeeks and adjust should work if the rule.start_date itself was on that day.
                        // If candidateDate is already on the correct day of week, addWeeks(interval) is fine.
                        // If not, this part is tricky.
                        // Let's refine:
                        let daysToAdd = rule.interval * 7;
                        tempNextDate = addDays(candidateDate, daysToAdd);
                         // Adjust to match ruleStartDate's day of week
                        const dayDiff = ruleStartDate.getUTCDay() - tempNextDate.getUTCDay();
                        tempNextDate = addDays(tempNextDate, dayDiff);

                    }
                }
                break;

            case "monthly":
                if (!rule.day_of_month || rule.day_of_month < 1 || rule.day_of_month > 31) {
                    return null; // Invalid rule
                }
                
                let monthCandidate = addMonths(candidateDate, 0); // Start with current candidate month
                
                // If the candidate's day is already >= rule.day_of_month, then we need to advance to the next interval month
                if (monthCandidate.getUTCDate() >= rule.day_of_month) {
                    monthCandidate = addMonths(monthCandidate, rule.interval);
                } else {
                    // If current interval is > 1, and we are in the same month but before the day_of_month,
                    // we might need to check if this month is an "interval month".
                    // For simplicity now, assume if day_of_month hasn't passed, this month *could* be it.
                    // The outer loop and comparison with fromReferenceDate will ensure correctness.
                    // If interval > 1, this needs to be relative to rule.start_date's month.
                     const monthsSinceRuleStart = 
                        (monthCandidate.getUTCFullYear() - ruleStartDate.getUTCFullYear()) * 12 + 
                        (monthCandidate.getUTCMonth() - ruleStartDate.getUTCMonth());
                    
                    if (monthsSinceRuleStart % rule.interval !== 0 && monthsSinceRuleStart > 0) { // Not an interval month, advance
                         monthCandidate = addMonths(monthCandidate, rule.interval - (monthsSinceRuleStart % rule.interval));
                    } else if (monthsSinceRuleStart < 0) { // Before rule start, advance to rule start month
                        monthCandidate = new Date(Date.UTC(ruleStartDate.getUTCFullYear(), ruleStartDate.getUTCMonth(), 1));
                    }
                }

                let targetDay = rule.day_of_month;
                const daysInTargetMonth = getDaysInMonth(monthCandidate.getUTCFullYear(), monthCandidate.getUTCMonth());
                targetDay = Math.min(targetDay, daysInTargetMonth); 

                tempNextDate = new Date(Date.UTC(monthCandidate.getUTCFullYear(), monthCandidate.getUTCMonth(), targetDay));
                break;

            case "yearly":
                return null; // Not yet supported
        }

        if (!tempNextDate) {
            return null; 
        }
        candidateDate = tempNextDate; // Update candidate for next loop

        // Ensure it's not before rule start_date (should be handled by calculationBaseDate logic mostly)
        if (candidateDate < ruleStartDate) {
            continue; 
        }
        
        if (candidateDate > calculationBaseDate && candidateDate >= fromReferenceDate) {
            if (ruleEndDate && candidateDate > ruleEndDate) {
                return null; // Next due date is past the rule's end date
            }
            nextDueDate = candidateDate;
            break; 
        }
        // If candidateDate is valid but too early (before fromReferenceDate), or not after calculationBaseDate yet, loop continues.
    }

    return nextDueDate;
}
