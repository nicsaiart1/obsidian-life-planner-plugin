// src/modules/journaling-reflection/MoodTracker.test.ts
import { getMoodData, MoodEntry } from './MoodTracker';
import { Vault, TFile, moment, FrontMatterCache } from 'obsidian';

// --- Mock Obsidian Vault and TFile (re-usable from HabitTracker.test.ts) ---
interface MockTFile {
    path: string;
}

interface MockFileCache {
    frontmatter?: Record<string, any>;
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

async function testGetMoodData() {
    console.log("Running test suite: getMoodData");

    // Test 1: No daily notes
    let mockVault = createMockVault({});
    let moodData = await getMoodData(mockVault as any as Vault, 30);
    console.assert(moodData.length === 0, "Test Failed (getMoodData - 1.1): No notes should yield no mood data.");

    // Test 2: Daily notes with no mood frontmatter
    const filesNoMoodFM = {
        [`daily/${moment().format('YYYY-MM-DD')}.md`]: { frontmatter: { habits: { exercise: true } } },
        [`daily/${moment().subtract(1, 'days').format('YYYY-MM-DD')}.md`]: { frontmatter: {} },
    };
    mockVault = createMockVault(filesNoMoodFM);
    moodData = await getMoodData(mockVault as any as Vault, 30);
    console.assert(moodData.length === 0, "Test Failed (getMoodData - 2.1): Notes without 'mood' key should yield no data.");

    // Test 3: Various mood inputs
    const todayStr = moment().format('YYYY-MM-DD');
    const yesterdayStr = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const twoDaysAgoStr = moment().subtract(2, 'days').format('YYYY-MM-DD');
    const threeDaysAgoStr = moment().subtract(3, 'days').format('YYYY-MM-DD');
    const fourDaysAgoStr = moment().subtract(4, 'days').format('YYYY-MM-DD');
    const fiveDaysAgoStr = moment().subtract(5, 'days').format('YYYY-MM-DD');
    const sixDaysAgoStr = moment().subtract(6, 'days').format('YYYY-MM-DD');


    const filesWithMoods = {
        [`daily/${todayStr}.md`]: { frontmatter: { mood: 5 } }, // Numerical
        [`daily/${yesterdayStr}.md`]: { frontmatter: { mood: '😊' } }, // Emoji
        [`daily/${twoDaysAgoStr}.md`]: { frontmatter: { mood: 'neutral' } }, // Keyword
        [`daily/${threeDaysAgoStr}.md`]: { frontmatter: { mood: 1 } }, // Numerical
        [`daily/${fourDaysAgoStr}.md`]: { frontmatter: { mood: '🙁' } }, // Emoji
        [`daily/${fiveDaysAgoStr}.md`]: { frontmatter: { mood: 'invalid_keyword' } }, // Invalid
        [`daily/${sixDaysAgoStr}.md`]: { frontmatter: { mood: 7 } }, // Invalid numerical
        [`daily/${moment().subtract(7, 'days').format('YYYY-MM-DD')}.md`]: { frontmatter: {} }, // No mood entry
    };
    mockVault = createMockVault(filesWithMoods);
    moodData = await getMoodData(mockVault as any as Vault, 8); // Look back 8 days

    console.assert(moodData.length === 5, `Test Failed (getMoodData - 3.1): Should find 5 valid mood entries. Got ${moodData.length}`);
    
    const todayEntry = moodData.find(m => m.date === todayStr);
    console.assert(todayEntry?.moodValue === 5, `Test Failed (getMoodData - 3.2): Mood for ${todayStr} should be 5. Got ${todayEntry?.moodValue}`);

    const yesterdayEntry = moodData.find(m => m.date === yesterdayStr);
    console.assert(yesterdayEntry?.moodValue === 5, `Test Failed (getMoodData - 3.3): Mood for ${yesterdayStr} (😊) should be 5. Got ${yesterdayEntry?.moodValue}`);
    
    const twoDaysAgoEntry = moodData.find(m => m.date === twoDaysAgoStr);
    console.assert(twoDaysAgoEntry?.moodValue === 3, `Test Failed (getMoodData - 3.4): Mood for ${twoDaysAgoStr} (neutral) should be 3. Got ${twoDaysAgoEntry?.moodValue}`);

    const threeDaysAgoEntry = moodData.find(m => m.date === threeDaysAgoStr);
    console.assert(threeDaysAgoEntry?.moodValue === 1, `Test Failed (getMoodData - 3.5): Mood for ${threeDaysAgoStr} should be 1. Got ${threeDaysAgoEntry?.moodValue}`);

    const fourDaysAgoEntry = moodData.find(m => m.date === fourDaysAgoStr);
    console.assert(fourDaysAgoEntry?.moodValue === 2, `Test Failed (getMoodData - 3.6): Mood for ${fourDaysAgoStr} (🙁) should be 2. Got ${fourDaysAgoEntry?.moodValue}`);

    // Test 4: Date sorting
    // Entries should be sorted by date ascending.
    // Dates are: six(invalid), five(invalid), four, three, two, yesterday, today
    // Valid mapped dates: fourDaysAgoStr, threeDaysAgoStr, twoDaysAgoStr, yesterdayStr, todayStr
    const expectedOrder = [fourDaysAgoStr, threeDaysAgoStr, twoDaysAgoStr, yesterdayStr, todayStr];
    for (let i = 0; i < moodData.length; i++) {
        console.assert(moodData[i].date === expectedOrder[i], `Test Failed (getMoodData - 4.1): Date sorting incorrect. Expected ${expectedOrder[i]} but got ${moodData[i].date} at index ${i}`);
    }

    // Test 5: Period includes days with and without entries (covered by Test 3)
    moodData = await getMoodData(mockVault as any as Vault, 3); // Look back only 3 days
    console.assert(moodData.length === 3, `Test Failed (getMoodData - 5.1): Should find 3 mood entries for 3 day lookback. Got ${moodData.length}`);
    const expectedOrderShort = [twoDaysAgoStr, yesterdayStr, todayStr];
     for (let i = 0; i < moodData.length; i++) {
        console.assert(moodData[i].date === expectedOrderShort[i], `Test Failed (getMoodData - 5.2): Date sorting incorrect for 3 day lookback. Expected ${expectedOrderShort[i]} but got ${moodData[i].date} at index ${i}`);
    }

    // Test 6: Mood value as string number "3"
    const filesWithMoodStringNum = {
        [`daily/${todayStr}.md`]: { frontmatter: { mood: "3" } },
    };
    mockVault = createMockVault(filesWithMoodStringNum);
    moodData = await getMoodData(mockVault as any as Vault, 1);
    console.assert(moodData.length === 1, `Test Failed (getMoodData - 6.1): Should find 1 mood entry. Got ${moodData.length}`);
    console.assert(moodData[0]?.moodValue === 3, `Test Failed (getMoodData - 6.2): Mood for ${todayStr} ("3") should be 3. Got ${moodData[0]?.moodValue}`);


    console.log("getMoodData: ALL PASSED");
}


async function runAllMoodTrackerTests() {
    console.log("--- Starting MoodTracker Tests ---");
    try {
        await testGetMoodData();
        console.log("\nAll MoodTracker tests completed successfully!");
    } catch (error) {
        console.error("\nAn error occurred during MoodTracker testing:", error);
        throw error;
    }
    console.log("--- Finished MoodTracker Tests ---");
}

// To run these tests:
// 1. Ensure Node.js and ts-node are installed.
// 2. Save this file as `MoodTracker.test.ts` in `src/modules/journaling-reflection/`.
// 3. Ensure `MoodTracker.ts` is in the same directory.
// 4. Execute from the root of your project:
//    `ts-node src/modules/journaling-reflection/MoodTracker.test.ts`

// runAllMoodTrackerTests(); // Uncomment or use a test runner

export { runAllMoodTrackerTests };
