// src/modules/journaling-reflection/MoodTracker.ts
import { Vault, TFile, moment, FrontMatterCache } from 'obsidian';

interface MoodFrontmatter {
    mood?: number | string;
}

export interface MoodEntry {
    date: string; // 'YYYY-MM-DD'
    moodValue: number;
}

const moodMapping: Record<string, number> = {
    // Emojis
    '😭': 1, // Very Sad / Terrible
    '😢': 1,
    '😞': 2, // Sad / Bad
    '🙁': 2,
    '😐': 3, // Neutral / Okay
    '🙂': 4, // Happy / Good
    '😊': 5, // Very Happy / Great
    '😁': 5,
    '😃': 5,
    // Keywords (optional, can be expanded)
    'terrible': 1,
    'bad': 2,
    'neutral': 3,
    'okay': 3,
    'good': 4,
    'great': 5,
    'happy': 5,
};

/**
 * Scans daily notes from the last `periodInDays` to extract mood data.
 * Assumes daily notes are in a 'daily/' folder and named 'YYYY-MM-DD.md'.
 * Mood is expected in YAML frontmatter under the 'mood' key.
 * Mood can be a number (1-5) or a recognized emoji/keyword string.
 */
export async function getMoodData(vault: Vault, periodInDays: number): Promise<MoodEntry[]> {
    const moodEntries: MoodEntry[] = [];
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
                const frontmatter = fileCache?.frontmatter as MoodFrontmatter | undefined;

                if (frontmatter && frontmatter.mood !== undefined && frontmatter.mood !== null) {
                    let moodValue: number | undefined = undefined;

                    if (typeof frontmatter.mood === 'number') {
                        if (frontmatter.mood >= 1 && frontmatter.mood <= 5) { // Assuming a 1-5 scale
                            moodValue = frontmatter.mood;
                        } else {
                            console.warn(`Mood value ${frontmatter.mood} for ${dateStr} is outside the expected 1-5 range. Skipping.`);
                        }
                    } else if (typeof frontmatter.mood === 'string') {
                        moodValue = moodMapping[frontmatter.mood.toLowerCase()];
                        if (moodValue === undefined) {
                             // Try to parse as number if it's a string like "3"
                            const parsedNum = parseFloat(frontmatter.mood);
                            if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 5) {
                                moodValue = parsedNum;
                            } else {
                                console.warn(`Unrecognized mood string '${frontmatter.mood}' for ${dateStr}. Skipping.`);
                            }
                        }
                    }

                    if (moodValue !== undefined) {
                        moodEntries.push({ date: dateStr, moodValue });
                    }
                }
            } catch (error) {
                console.error(`Error processing daily note ${dailyNotePath} for mood:`, error);
                // Continue to next file
            }
        }
    }

    // Sort entries by date in ascending order
    moodEntries.sort((a, b) => moment(a.date, 'YYYY-MM-DD').diff(moment(b.date, 'YYYY-MM-DD')));
    
    return moodEntries;
}
