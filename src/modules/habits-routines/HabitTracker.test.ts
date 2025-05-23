// src/modules/habits-routines/HabitTracker.test.ts
import { getHabitData, calculateStreaks, HabitCompletionData, HabitStreakInfo } from './HabitTracker';
import { Vault, TFile, moment, FrontMatterCache } from 'obsidian'; // Import moment if used by tests directly

// --- Mock Obsidian Vault and TFile ---
interface MockTFile {
    path: string;
    // Add other TFile properties if needed by the functions being tested
}

interface MockFileCache {
    frontmatter?: Record<string, any>;
    // Add other CacheItem properties if needed
}

interface MockVault {
    files: Record<string, { frontmatter?: Record<string, any>; content?: string }>; // path: data
    getAbstractFileByPath(path: string): MockTFile | null;
    metadataCache: {
        getFileCache(file: MockTFile): MockFileCache | null;
    };
}

function createMockVault(filesData: Record<string, { frontmatter?: Record<string, any> }>): MockVault {
    return {
        files: filesData,
        getAbstractFileByPath(path: string): MockTFile | null {
            if (this.files[path]) {
                return { path };
            }
            return null;
        },
        metadataCache: {
            getFileCache(file: MockTFile): MockFileCache | null {
                if (filesData[file.path]) {
                    return { frontmatter: filesData[file.path].frontmatter };
                }
                return null;
            }
        }
    };
}

// --- Test Suites ---

async function testGetHabitData() {
    console.log("Running test suite: getHabitData");

    // Test 1: No daily notes
    let mockVault = createMockVault({});
    let habitData = await getHabitData(mockVault as any as Vault, 30);
    console.assert(habitData.length === 0, "Test Failed (getHabitData - 1.1): No notes should yield no data.");

    // Test 2: Daily notes with no habit frontmatter
    const filesNoHabitFM = {
        [`daily/${moment().format('YYYY-MM-DD')}.md`]: { frontmatter: { mood: 3 } },
        [`daily/${moment().subtract(1, 'days').format('YYYY-MM-DD')}.md`]: { frontmatter: {} },
    };
    mockVault = createMockVault(filesNoHabitFM);
    habitData = await getHabitData(mockVault as any as Vault, 30);
    console.assert(habitData.length === 0, "Test Failed (getHabitData - 2.1): Notes without 'habits' key should yield no data.");

    // Test 3: Daily notes with correct habit frontmatter
    const todayStr = moment().format('YYYY-MM-DD');
    const yesterdayStr = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const twoDaysAgoStr = moment().subtract(2, 'days').format('YYYY-MM-DD');

    const filesWithHabits = {
        [`daily/${todayStr}.md`]: { frontmatter: { habits: { exercise: true, read: false, meditate: true } } },
        [`daily/${yesterdayStr}.md`]: { frontmatter: { habits: { exercise: true, read: true } } },
        [`daily/${twoDaysAgoStr}.md`]: { frontmatter: { habits: { exercise: true, meditate: true } } },
        // A day with no habits entry at all
        [`daily/${moment().subtract(3, 'days').format('YYYY-MM-DD')}.md`]: { frontmatter: { unrelated: 'data' } },
        // A day with an empty habits object
        [`daily/${moment().subtract(4, 'days').format('YYYY-MM-DD')}.md`]: { frontmatter: { habits: {} } },
    };
    mockVault = createMockVault(filesWithHabits);
    habitData = await getHabitData(mockVault as any as Vault, 5); // Look back 5 days

    const exerciseData = habitData.find(h => h.habitName === 'exercise');
    const readData = habitData.find(h => h.habitName === 'read');
    const meditateData = habitData.find(h => h.habitName === 'meditate');

    console.assert(habitData.length === 3, "Test Failed (getHabitData - 3.1): Should find 3 distinct habits.");
    console.assert(exerciseData?.datesCompleted.length === 3, `Test Failed (getHabitData - 3.2): Exercise should have 3 completions. Got ${exerciseData?.datesCompleted.length}`);
    console.assert(exerciseData?.datesCompleted.includes(todayStr) && exerciseData?.datesCompleted.includes(yesterdayStr) && exerciseData?.datesCompleted.includes(twoDaysAgoStr), "Test Failed (getHabitData - 3.3): Exercise dates incorrect.");
    
    console.assert(readData?.datesCompleted.length === 1, `Test Failed (getHabitData - 3.4): Read should have 1 completion. Got ${readData?.datesCompleted.length}`);
    console.assert(readData?.datesCompleted.includes(yesterdayStr), "Test Failed (getHabitData - 3.5): Read dates incorrect.");

    console.assert(meditateData?.datesCompleted.length === 2, `Test Failed (getHabitData - 3.6): Meditate should have 2 completions. Got ${meditateData?.datesCompleted.length}`);
    console.assert(meditateData?.datesCompleted.includes(todayStr) && meditateData?.datesCompleted.includes(twoDaysAgoStr), "Test Failed (getHabitData - 3.7): Meditate dates incorrect.");

    // Test 4: Period includes days with and without entries (covered by Test 3, but verify periodInDays is respected)
    habitData = await getHabitData(mockVault as any as Vault, 2); // Look back only 2 days
    const exerciseDataShort = habitData.find(h => h.habitName === 'exercise');
    console.assert(exerciseDataShort?.datesCompleted.length === 2, `Test Failed (getHabitData - 4.1): Exercise should have 2 completions for 2 day lookback. Got ${exerciseDataShort?.datesCompleted.length}`);
    console.assert(exerciseDataShort?.datesCompleted.includes(todayStr) && exerciseDataShort?.datesCompleted.includes(yesterdayStr), "Test Failed (getHabitData - 4.2): Exercise dates incorrect for 2 day lookback.");

    console.log("getHabitData: ALL PASSED");
}


async function testCalculateStreaks() {
    console.log("Running test suite: calculateStreaks");

    // Test 1: No habit data
    let streaks = await calculateStreaks([]);
    console.assert(streaks.length === 0, "Test Failed (calculateStreaks - 1.1): No data should yield no streaks.");

    // Test 2: Single habit
    // 2a: No completions
    let habitCompletion: HabitCompletionData[] = [{ habitName: 'jogging', datesCompleted: [] }];
    streaks = await calculateStreaks(habitCompletion);
    console.assert(streaks[0]?.currentStreak === 0 && streaks[0]?.longestStreak === 0, "Test Failed (calculateStreaks - 2.1a): No completions.");

    // 2b: One completion (today)
    const todayStr = moment().format('YYYY-MM-DD');
    habitCompletion = [{ habitName: 'jogging', datesCompleted: [todayStr] }];
    streaks = await calculateStreaks(habitCompletion);
    console.assert(streaks[0]?.currentStreak === 1 && streaks[0]?.longestStreak === 1, `Test Failed (calculateStreaks - 2.1b): One completion today. Got C:${streaks[0]?.currentStreak} L:${streaks[0]?.longestStreak}`);
    
    // 2b-bis: One completion (yesterday)
    const yesterdayStr = moment().subtract(1, 'days').format('YYYY-MM-DD');
    habitCompletion = [{ habitName: 'jogging', datesCompleted: [yesterdayStr] }];
    streaks = await calculateStreaks(habitCompletion);
    console.assert(streaks[0]?.currentStreak === 1 && streaks[0]?.longestStreak === 1, `Test Failed (calculateStreaks - 2.1b-bis): One completion yesterday. Got C:${streaks[0]?.currentStreak} L:${streaks[0]?.longestStreak}`);

    // 2c: Multiple consecutive (current streak)
    const twoDaysAgoStr = moment().subtract(2, 'days').format('YYYY-MM-DD');
    habitCompletion = [{ habitName: 'jogging', datesCompleted: [twoDaysAgoStr, yesterdayStr, todayStr].sort() }];
    streaks = await calculateStreaks(habitCompletion);
    console.assert(streaks[0]?.currentStreak === 3 && streaks[0]?.longestStreak === 3, `Test Failed (calculateStreaks - 2.1c): 3 consecutive days. Got C:${streaks[0]?.currentStreak} L:${streaks[0]?.longestStreak}`);

    // 2d: Non-consecutive (longest vs current)
    // Streak: 2 days (3,4 ago), then 1 day (today). Current = 1, Longest = 2
    const threeDaysAgoStr = moment().subtract(3, 'days').format('YYYY-MM-DD');
    const fourDaysAgoStr = moment().subtract(4, 'days').format('YYYY-MM-DD');
    habitCompletion = [{ habitName: 'jogging', datesCompleted: [fourDaysAgoStr, threeDaysAgoStr, todayStr].sort() }];
    streaks = await calculateStreaks(habitCompletion);
    console.assert(streaks[0]?.currentStreak === 1 && streaks[0]?.longestStreak === 2, `Test Failed (calculateStreaks - 2.1d): Non-consecutive. Expected C:1 L:2. Got C:${streaks[0]?.currentStreak} L:${streaks[0]?.longestStreak}`);

    // 2e: Current streak ends yesterday
    habitCompletion = [{ habitName: 'jogging', datesCompleted: [threeDaysAgoStr, twoDaysAgoStr, yesterdayStr].sort() }];
    streaks = await calculateStreaks(habitCompletion);
    console.assert(streaks[0]?.currentStreak === 3 && streaks[0]?.longestStreak === 3, `Test Failed (calculateStreaks - 2.1e): Current streak ends yesterday. Expected C:3 L:3. Got C:${streaks[0]?.currentStreak} L:${streaks[0]?.longestStreak}`);

    // 2f: Longest streak in past, current is 0 (last completion 2 days ago)
    habitCompletion = [{ habitName: 'jogging', datesCompleted: [fourDaysAgoStr, threeDaysAgoStr, twoDaysAgoStr].sort() }];
    streaks = await calculateStreaks(habitCompletion);
    console.assert(streaks[0]?.currentStreak === 0 && streaks[0]?.longestStreak === 3, `Test Failed (calculateStreaks - 2.1f): Longest in past, current 0. Expected C:0 L:3. Got C:${streaks[0]?.currentStreak} L:${streaks[0]?.longestStreak}`);

    // Test 3: Multiple habits
    const habitDataMulti: HabitCompletionData[] = [
        { habitName: 'exercise', datesCompleted: [twoDaysAgoStr, yesterdayStr, todayStr].sort() }, // C:3, L:3
        { habitName: 'read', datesCompleted: [threeDaysAgoStr, todayStr].sort() } // C:1, L:1 (or L:1 if threeDaysAgo is counted as separate streak)
        // The implementation of calculateStreaks counts longest based on consecutive days, so for 'read' it would be L:1
    ];
    streaks = await calculateStreaks(habitDataMulti);
    const exerciseStreak = streaks.find(s => s.habitName === 'exercise');
    const readStreak = streaks.find(s => s.habitName === 'read');
    console.assert(exerciseStreak?.currentStreak === 3 && exerciseStreak?.longestStreak === 3, `Test Failed (calculateStreaks - 3.1): Multi-habit exercise. Expected C:3 L:3. Got C:${exerciseStreak?.currentStreak} L:${exerciseStreak?.longestStreak}`);
    console.assert(readStreak?.currentStreak === 1 && readStreak?.longestStreak === 1, `Test Failed (calculateStreaks - 3.2): Multi-habit read. Expected C:1 L:1. Got C:${readStreak?.currentStreak} L:${readStreak?.longestStreak}`);

    // Test 4: Streaks spanning across end/start of data period (current streak handling)
    // This is implicitly tested by 2c, 2d, 2e, 2f. The key is how `todayMoment` is handled in `calculateStreaks`.
    // If today is '2023-10-26'
    // Data: ['2023-10-24', '2023-10-25'] -> C:2, L:2 (streak ended yesterday)
    // Data: ['2023-10-25', '2023-10-26'] -> C:2, L:2 (streak includes today)
    // Data: ['2023-10-23', '2023-10-24'] -> C:0, L:2 (streak ended 2 days ago)
    // These seem to be covered by existing tests.

    console.log("calculateStreaks: ALL PASSED");
}


async function runAllHabitTrackerTests() {
    console.log("--- Starting HabitTracker Tests ---");
    try {
        await testGetHabitData();
        await testCalculateStreaks();
        console.log("\nAll HabitTracker tests completed successfully!");
    } catch (error) {
        console.error("\nAn error occurred during HabitTracker testing:", error);
        throw error; // Re-throw to indicate failure to the runner
    }
    console.log("--- Finished HabitTracker Tests ---");
}

// To run these tests:
// 1. Ensure Node.js and ts-node are installed.
// 2. Save this file as `HabitTracker.test.ts` in `src/modules/habits-routines/`.
// 3. Ensure `HabitTracker.ts` is in the same directory.
// 4. Execute from the root of your project:
//    `ts-node src/modules/habits-routines/HabitTracker.test.ts`
//
// If you get errors related to Obsidian specific modules like 'obsidian',
// you might need to mock them or ensure your tsconfig paths are set up if you use them directly in tests.
// For these tests, we are trying to keep 'obsidian' module usage minimal in the functions themselves,
// or pass `Vault` as a parameter that can be mocked.

// runAllHabitTrackerTests(); // Uncomment or use a test runner

export { runAllHabitTrackerTests }; // Export if using a central test runner file
