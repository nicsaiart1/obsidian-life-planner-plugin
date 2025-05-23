// src/modules/timeline/TimelineManager.test.ts
import { getLifeEvents, LifeEvent } from './TimelineManager'; // Adjust path if needed
import { Vault, TFile, TFolder, moment } from 'obsidian';

// --- Mock Obsidian Vault, TFile, TFolder (adapted from previous tests) ---
interface MockTAbstractFile {
    path: string;
    name: string;
}

interface MockTFile extends MockTAbstractFile {
    extension: string;
    // Add other TFile properties if needed by the functions being tested
}

interface MockTFolder extends MockTAbstractFile {
    children: MockTAbstractFile[];
    // Add other TFolder properties if needed
}

interface MockFileCache {
    frontmatter?: Record<string, any>;
}

interface MockVault {
    files: Record<string, { frontmatter?: Record<string, any>; content?: string; type: 'file' | 'folder'; children?: string[] }>; // path: data
    getAbstractFileByPath(path: string): MockTFile | MockTFolder | null;
    metadataCache: {
        getFileCache(file: MockTFile): MockFileCache | null;
    };
}

function createMockVault(filesData: Record<string, { 
    frontmatter?: Record<string, any>; 
    type: 'file' | 'folder'; 
    children?: string[]; // Paths of children if it's a folder
}>): MockVault {
    return {
        files: filesData,
        getAbstractFileByPath(path: string): MockTFile | MockTFolder | null {
            const fileData = this.files[path];
            if (fileData) {
                if (fileData.type === 'file') {
                    return { path, name: path.split('/').pop() || '', extension: path.split('.').pop() || '' } as MockTFile;
                } else { // folder
                    const childrenFiles = (fileData.children || [])
                        .map(childPath => this.getAbstractFileByPath(childPath!))
                        .filter(child => child !== null) as MockTAbstractFile[];
                    return { path, name: path.split('/').pop() || '', children: childrenFiles } as MockTFolder;
                }
            }
            return null;
        },
        metadataCache: {
            getFileCache(file: MockTFile): MockFileCache | null {
                if (filesData[file.path] && filesData[file.path].type === 'file') {
                    return { frontmatter: filesData[file.path].frontmatter };
                }
                return null;
            }
        }
    };
}

// --- Test Suites ---

async function testGetLifeEvents() {
    console.log("Running test suite: getLifeEvents for TimelineManager");

    // Test 1: No event notes / events folder missing
    let mockVault = createMockVault({}); // No 'events/' folder defined
    let lifeEvents = await getLifeEvents(mockVault as any as Vault);
    console.assert(lifeEvents.length === 0, "Test Failed (getLifeEvents - 1.1): No events folder should yield no events.");

    mockVault = createMockVault({ 'events/': { type: 'folder', children: [] } }); // Empty 'events/' folder
    lifeEvents = await getLifeEvents(mockVault as any as Vault);
    console.assert(lifeEvents.length === 0, "Test Failed (getLifeEvents - 1.2): Empty events folder should yield no events.");

    // Test 2: Notes without required frontmatter
    const filesMissingFM = {
        'events/': { type: 'folder', children: ['events/event1.md', 'events/event2.md', 'events/event3.md'] },
        'events/event1.md': { type: 'file', frontmatter: { eventTitle: "Title Only" } }, // Missing eventDate
        'events/event2.md': { type: 'file', frontmatter: { eventDate: "2023-01-01" } }, // Missing eventTitle
        'events/event3.md': { type: 'file', frontmatter: {} }, // Empty frontmatter
    };
    mockVault = createMockVault(filesMissingFM);
    lifeEvents = await getLifeEvents(mockVault as any as Vault);
    console.assert(lifeEvents.length === 0, `Test Failed (getLifeEvents - 2.1): Notes missing required FM should be skipped. Got ${lifeEvents.length}`);

    // Test 3: Invalid eventDate format
    const filesInvalidDate = {
        'events/': { type: 'folder', children: ['events/event_invalid_date.md'] },
        'events/event_invalid_date.md': { type: 'file', frontmatter: { eventDate: "01-01-2023", eventTitle: "Invalid Date Format" } },
    };
    mockVault = createMockVault(filesInvalidDate);
    lifeEvents = await getLifeEvents(mockVault as any as Vault);
    console.assert(lifeEvents.length === 0, "Test Failed (getLifeEvents - 3.1): Invalid date format should be skipped.");

    // Test 4: Correct event notes & default values
    const filesCorrect = {
        'events/': { type: 'folder', children: ['events/event_full.md', 'events/event_minimal.md', 'events/event_unsorted.md'] },
        'events/event_full.md': { 
            type: 'file', 
            frontmatter: { 
                eventType: "Career", 
                eventDate: "2020-06-15", 
                eventTitle: "Started First Job", 
                eventDescription: "Acme Corp.", 
                eventIcon: "briefcase" 
            } 
        },
        'events/event_minimal.md': { // To test defaults
            type: 'file', 
            frontmatter: { 
                eventDate: "2019-08-01", 
                eventTitle: "Graduated University" 
            } 
        },
        'events/event_unsorted.md': { // To test sorting
            type: 'file', 
            frontmatter: { 
                eventDate: "2021-01-10", 
                eventTitle: "Moved to New City",
                eventType: "Personal"
            } 
        }
    };
    mockVault = createMockVault(filesCorrect);
    lifeEvents = await getLifeEvents(mockVault as any as Vault);

    console.assert(lifeEvents.length === 3, `Test Failed (getLifeEvents - 4.1): Should parse 3 valid events. Got ${lifeEvents.length}`);

    const eventFull = lifeEvents.find(e => e.title === "Started First Job");
    console.assert(!!eventFull, "Test Failed (getLifeEvents - 4.2): Full event not found.");
    if (eventFull) {
        console.assert(moment(eventFull.date).format('YYYY-MM-DD') === "2020-06-15", `Test Failed (getLifeEvents - 4.3): Full event date incorrect. Got ${moment(eventFull.date).format('YYYY-MM-DD')}`);
        console.assert(eventFull.type === "Career", `Test Failed (getLifeEvents - 4.4): Full event type incorrect. Got ${eventFull.type}`);
        console.assert(eventFull.description === "Acme Corp.", `Test Failed (getLifeEvents - 4.5): Full event description incorrect. Got ${eventFull.description}`);
        console.assert(eventFull.icon === "briefcase", `Test Failed (getLifeEvents - 4.6): Full event icon incorrect. Got ${eventFull.icon}`);
    }

    const eventMinimal = lifeEvents.find(e => e.title === "Graduated University");
    console.assert(!!eventMinimal, "Test Failed (getLifeEvents - 4.7): Minimal event not found.");
    if (eventMinimal) {
        console.assert(moment(eventMinimal.date).format('YYYY-MM-DD') === "2019-08-01", `Test Failed (getLifeEvents - 4.8): Minimal event date incorrect. Got ${moment(eventMinimal.date).format('YYYY-MM-DD')}`);
        console.assert(eventMinimal.type === "General", `Test Failed (getLifeEvents - 4.9): Minimal event type should default to 'General'. Got ${eventMinimal.type}`);
        console.assert(eventMinimal.description === "", `Test Failed (getLifeEvents - 4.10): Minimal event description should default to empty string. Got ${eventMinimal.description}`);
        console.assert(eventMinimal.icon === undefined, `Test Failed (getLifeEvents - 4.11): Minimal event icon should be undefined. Got ${eventMinimal.icon}`);
    }
    
    // Test 5: Sorting (already implicitly checked by order if tests 4.x pass)
    const expectedOrder = ["2019-08-01", "2020-06-15", "2021-01-10"];
    for (let i = 0; i < lifeEvents.length; i++) {
        console.assert(moment(lifeEvents[i].date).format('YYYY-MM-DD') === expectedOrder[i], `Test Failed (getLifeEvents - 5.1): Event sorting incorrect. Expected ${expectedOrder[i]} but got ${moment(lifeEvents[i].date).format('YYYY-MM-DD')} at index ${i}`);
    }

    // Test 6: Non-markdown files in events folder
    const filesWithNonMd = {
        'events/': { type: 'folder', children: ['events/event_good.md', 'events/notes.txt'] },
        'events/event_good.md': { 
            type: 'file', 
            frontmatter: { eventDate: "2022-02-02", eventTitle: "Good Event" } 
        },
        'events/notes.txt': { type: 'file', frontmatter: {} } // No frontmatter, but also not .md
    };
    mockVault = createMockVault(filesWithNonMd);
    lifeEvents = await getLifeEvents(mockVault as any as Vault);
    console.assert(lifeEvents.length === 1, `Test Failed (getLifeEvents - 6.1): Should only parse .md files. Got ${lifeEvents.length}`);
    console.assert(lifeEvents[0]?.title === "Good Event", "Test Failed (getLifeEvents - 6.2): Correct event not parsed when non-md file present.");


    console.log("getLifeEvents for TimelineManager: ALL PASSED");
}


async function runAllTimelineManagerTests() {
    console.log("--- Starting TimelineManager Tests ---");
    try {
        await testGetLifeEvents();
        console.log("\nAll TimelineManager tests completed successfully!");
    } catch (error) {
        console.error("\nAn error occurred during TimelineManager testing:", error);
        throw error; // Re-throw to indicate failure to the runner
    }
    console.log("--- Finished TimelineManager Tests ---");
}

// To run these tests:
// 1. Ensure Node.js and ts-node are installed.
// 2. Save this file as `TimelineManager.test.ts` in `src/modules/timeline/`.
// 3. Ensure `TimelineManager.ts` is in the same directory.
// 4. Execute from the root of your project:
//    `ts-node src/modules/timeline/TimelineManager.test.ts`
//
// Note: The mock vault setup here is slightly more complex due to needing to simulate TFolder and its children.
// The `moment` import is used by the test itself for date assertions.

// runAllTimelineManagerTests(); // Uncomment or use a test runner

export { runAllTimelineManagerTests };
