// src/modules/financial-life/NetWorthChart.test.ts
import { getNetWorthData, NetWorthEntry } from './NetWorthChart';
import { Vault, TFile, moment, FrontMatterCache } from 'obsidian';

// --- Mock Obsidian Vault and TFile (re-usable) ---
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

async function testGetNetWorthData() {
    console.log("Running test suite: getNetWorthData for NetWorthChart");

    // Test 1: No monthly notes
    let mockVault = createMockVault({});
    let netWorthData = await getNetWorthData(mockVault as any as Vault, 12);
    console.assert(netWorthData.length === 0, "Test Failed (getNetWorthData - 1.1): No notes should yield no net worth data.");

    // Test 2: Monthly notes with no netWorth frontmatter
    const filesNoNetWorthFM = {
        [`monthly/${moment().format('YYYY-MM')}.md`]: { frontmatter: { someOtherData: 'value' } },
        [`monthly/${moment().subtract(1, 'months').format('YYYY-MM')}.md`]: { frontmatter: {} },
    };
    mockVault = createMockVault(filesNoNetWorthFM);
    netWorthData = await getNetWorthData(mockVault as any as Vault, 12);
    console.assert(netWorthData.length === 0, "Test Failed (getNetWorthData - 2.1): Notes without 'netWorth' key should yield no data.");

    // Test 3: Correct netWorth entries
    // Current month: e.g. 2023-10
    const currentMonthStr = moment().format('YYYY-MM'); // e.g., 2023-10
    const prevMonthStr = moment().subtract(1, 'months').format('YYYY-MM'); // e.g., 2023-09
    const twoMonthsAgoStr = moment().subtract(2, 'months').format('YYYY-MM'); // e.g., 2023-08

    const filesWithNetWorth = {
        [`monthly/${currentMonthStr}.md`]: { frontmatter: { netWorth: 100000 } },
        [`monthly/${prevMonthStr}.md`]: { frontmatter: { netWorth: 95000 } },
        [`monthly/${twoMonthsAgoStr}.md`]: { frontmatter: { netWorth: 90000, unrelated: 'test' } },
        [`monthly/${moment().subtract(3, 'months').format('YYYY-MM')}.md`]: { frontmatter: { netWorth: "invalid" } }, // Invalid type
        [`monthly/${moment().subtract(4, 'months').format('YYYY-MM')}.md`]: { frontmatter: {} }, // No netWorth
    };
    mockVault = createMockVault(filesWithNetWorth);
    netWorthData = await getNetWorthData(mockVault as any as Vault, 5); // Look back 5 months

    console.assert(netWorthData.length === 3, `Test Failed (getNetWorthData - 3.1): Should find 3 valid net worth entries. Got ${netWorthData.length}`);
    
    const entryCurrent = netWorthData.find(e => e.date === moment(currentMonthStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'));
    console.assert(entryCurrent?.netWorth === 100000, `Test Failed (getNetWorthData - 3.2): Net worth for ${currentMonthStr} incorrect. Got ${entryCurrent?.netWorth}`);

    const entryPrev = netWorthData.find(e => e.date === moment(prevMonthStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'));
    console.assert(entryPrev?.netWorth === 95000, `Test Failed (getNetWorthData - 3.3): Net worth for ${prevMonthStr} incorrect. Got ${entryPrev?.netWorth}`);

    const entryTwoAgo = netWorthData.find(e => e.date === moment(twoMonthsAgoStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'));
    console.assert(entryTwoAgo?.netWorth === 90000, `Test Failed (getNetWorthData - 3.4): Net worth for ${twoMonthsAgoStr} incorrect. Got ${entryTwoAgo?.netWorth}`);


    // Test 4: lookbackMonths respected
    netWorthData = await getNetWorthData(mockVault as any as Vault, 2); // Look back only 2 months
    console.assert(netWorthData.length === 2, `Test Failed (getNetWorthData - 4.1): Should find 2 net worth entries for 2 month lookback. Got ${netWorthData.length}`);
    const foundDatesLookback = netWorthData.map(e => e.date).sort();
    const expectedDatesLookback = [
        moment(prevMonthStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'),
        moment(currentMonthStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'),
    ].sort();
    console.assert(JSON.stringify(foundDatesLookback) === JSON.stringify(expectedDatesLookback), `Test Failed (getNetWorthData - 4.2): Dates incorrect for 2 month lookback. Expected ${JSON.stringify(expectedDatesLookback)}, Got ${JSON.stringify(foundDatesLookback)}`);


    // Test 5: Date sorting
    // Data is added based on loop from today backwards, then sorted.
    // Expected order: twoMonthsAgoStr, prevMonthStr, currentMonthStr (oldest to newest)
    const expectedOrder = [
        moment(twoMonthsAgoStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'),
        moment(prevMonthStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'),
        moment(currentMonthStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'),
    ];
    // Re-fetch with appropriate lookback to get all 3 valid entries
    netWorthData = await getNetWorthData(mockVault as any as Vault, 3); 
    for (let i = 0; i < netWorthData.length; i++) {
        console.assert(netWorthData[i].date === expectedOrder[i], `Test Failed (getNetWorthData - 5.1): Date sorting incorrect. Expected ${expectedOrder[i]} but got ${netWorthData[i].date} at index ${i}`);
    }
    
    // Test 6: File not found for a month within lookback
    const filesMissingMonth = {
        [`monthly/${currentMonthStr}.md`]: { frontmatter: { netWorth: 100000 } },
        // prevMonthStr is missing
        [`monthly/${twoMonthsAgoStr}.md`]: { frontmatter: { netWorth: 90000 } },
    };
    mockVault = createMockVault(filesMissingMonth);
    netWorthData = await getNetWorthData(mockVault as any as Vault, 3);
    console.assert(netWorthData.length === 2, `Test Failed (getNetWorthData - 6.1): Should find 2 entries when one month is missing. Got ${netWorthData.length}`);
    const foundDatesMissing = netWorthData.map(e => e.date).sort();
    const expectedDatesMissing = [
        moment(twoMonthsAgoStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'),
        moment(currentMonthStr, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'),
    ].sort();
    console.assert(JSON.stringify(foundDatesMissing) === JSON.stringify(expectedDatesMissing), `Test Failed (getNetWorthData - 6.2): Dates incorrect when a month's file is missing. Expected ${JSON.stringify(expectedDatesMissing)}, Got ${JSON.stringify(foundDatesMissing)}`);


    console.log("getNetWorthData for NetWorthChart: ALL PASSED");
}


async function runAllNetWorthChartLogicTests() {
    console.log("--- Starting NetWorthChart Logic Tests ---");
    try {
        await testGetNetWorthData();
        console.log("\nAll NetWorthChart logic tests completed successfully!");
    } catch (error) {
        console.error("\nAn error occurred during NetWorthChart logic testing:", error);
        throw error;
    }
    console.log("--- Finished NetWorthChart Logic Tests ---");
}

// To run these tests:
// 1. Ensure Node.js and ts-node are installed.
// 2. Save this file as `NetWorthChart.test.ts` in `src/modules/financial-life/`.
// 3. Ensure `NetWorthChart.ts` is in the same directory.
// 4. Execute from the root of your project:
//    `ts-node src/modules/financial-life/NetWorthChart.test.ts`

// runAllNetWorthChartLogicTests(); // Uncomment or use a test runner

export { runAllNetWorthChartLogicTests };
