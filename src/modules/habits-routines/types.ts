// src/modules/habits-routines/types.ts

export interface Habit {
  id: string;
  name: string;
  description?: string; // Optional description
  frequency: HabitFrequency; // e.g., daily, weekly, specific days
  target?: number; // e.g., run 5 km, meditate for 10 minutes
  targetUnit?: string; // e.g., "km", "minutes"
  streak: number; // Current streak
  lastCompletedDate?: string; // ISO date string YYYY-MM-DD
  createdAt: string; // ISO date string YYYY-MM-DD
}

export type HabitFrequencyType = 'daily' | 'weekly' | 'monthly' | 'specific_days';

export interface HabitFrequency {
  type: HabitFrequencyType;
  days?: number[]; // For 'specific_days' (0=Sunday, 1=Monday, ...), or day of month for 'monthly'
  interval?: number; // For 'weekly' (e.g., every 2 weeks), 'monthly' (e.g., every 2 months)
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  habitIds: string[]; // Array of Habit IDs
  schedule?: RoutineSchedule; // When the routine should be performed
  createdAt: string; // ISO date string YYYY-MM-DD
}

export type RoutineScheduleType = 'daily' | 'weekly' | 'on_demand';

export interface RoutineSchedule {
  type: RoutineScheduleType;
  time?: string; // e.g., "08:00" for daily/weekly routines
  days?: number[]; // For 'weekly' (0=Sunday, 1=Monday, ...)
}

// Example of a more specific frequency type if needed later:
// export interface SpecificDaysFrequency {
//   type: 'specific_days';
//   days: DayOfWeek[]; // e.g., [DayOfWeek.Monday, DayOfWeek.Wednesday]
// }
// export enum DayOfWeek { Sunday = 0, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }
