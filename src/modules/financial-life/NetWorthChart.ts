// src/modules/financial-life/NetWorthChart.ts
import { Vault, TFile, moment, FrontMatterCache } from 'obsidian';

interface NetWorthFrontmatter {
    netWorth?: number;
    // Allow for other financial data, but we only care about netWorth
    financials?: {
        netWorth?: number;
    };
}

export interface NetWorthEntry {
    date: string; // 'YYYY-MM-DD', representing the first day of the month
    netWorth: number;
}

/**
 * Scans monthly notes from the last `lookbackMonths` to extract net worth data.
 * Assumes monthly notes are in a 'monthly/' folder and named 'YYYY-MM.md'.
 * Net worth is expected in YAML frontmatter under the 'netWorth' key.
 * The date for each entry will be the first day of the month.
 */
export async function getNetWorthData(vault: Vault, lookbackMonths: number): Promise<NetWorthEntry[]> {
    const netWorthEntries: NetWorthEntry[] = [];
    const today = moment(); // Use current date to start looking back

    for (let i = 0; i < lookbackMonths; i++) {
        // Go back month by month from the current month
        // If today is Jan 15, 2023, for i=0, it's Jan 2023. For i=1, it's Dec 2022.
        const targetMonth = today.clone().subtract(i, 'months');
        const monthStr = targetMonth.format('YYYY-MM');
        const firstDayOfMonthStr = targetMonth.startOf('month').format('YYYY-MM-DD');
        
        // Path assumption for monthly notes
        const monthlyNotePath = `monthly/${monthStr}.md`; 

        const file = vault.getAbstractFileByPath(monthlyNotePath);
        if (file instanceof TFile) {
            try {
                const fileCache = await vault.metadataCache.getFileCache(file);
                const frontmatter = fileCache?.frontmatter as NetWorthFrontmatter | undefined;

                let extractedNetWorth: number | undefined = undefined;

                if (frontmatter) {
                    if (typeof frontmatter.netWorth === 'number') {
                        extractedNetWorth = frontmatter.netWorth;
                    } 
                    // Optional: Check within a 'financials' object as per one of the suggestions,
                    // though the primary chosen format is direct `netWorth`.
                    // else if (frontmatter.financials && typeof frontmatter.financials.netWorth === 'number') {
                    //     extractedNetWorth = frontmatter.financials.netWorth;
                    // }
                }

                if (extractedNetWorth !== undefined) {
                    if (isNaN(extractedNetWorth)) {
                        console.warn(`Net worth value in ${monthlyNotePath} is NaN. Skipping.`);
                        continue;
                    }
                    netWorthEntries.push({ date: firstDayOfMonthStr, netWorth: extractedNetWorth });
                } else {
                    // console.log(`No netWorth frontmatter found in ${monthlyNotePath} or value is not a number.`);
                }
            } catch (error) {
                console.error(`Error processing monthly note ${monthlyNotePath} for net worth:`, error);
                // Continue to next file
            }
        } else {
            // console.log(`Monthly note ${monthlyNotePath} not found.`);
        }
    }

    // Sort entries by date in ascending order (important for charting)
    netWorthEntries.sort((a, b) => moment(a.date, 'YYYY-MM-DD').diff(moment(b.date, 'YYYY-MM-DD')));
    
    return netWorthEntries;
}
