// src/modules/time-management/TimeBlockingPlanner.ts
import { App, TFile, FrontMatterCache } from 'obsidian'; // Added TFile and FrontMatterCache
import * as yaml from 'js-yaml';

export interface TimeBlock {
    id: string;         // Unique ID
    title: string;
    startTime: string;  // ISO 8601 string
    endTime: string;    // ISO 8601 string
    allDay?: boolean;
    taskId?: string;
    notes?: string;
}

// This is a simplified representation of how one might get an App instance.
// In a real plugin, 'app' is available on the plugin class instance (this.app).
// For standalone functions or services, it would need to be passed around (dependency injection).
let _app: App;
export function initTimeBlocking(obsidianApp: App) {
    _app = obsidianApp;
    console.log("TimeBlockingPlanner initialized with Obsidian App instance.");
}

// --- Helper Functions (Conceptual for direct file access, prefer Obsidian API) ---

/**
 * Conceptually gets the path to a daily note.
 * In a real scenario, this might involve checking user settings for date format and daily note location.
 */
function getDailyNotePath(date: string): string {
    return `daily/${date}.md`; // Assumes 'daily/YYYY-MM-DD.md' structure
}

/**
 * Simulates reading the raw content of a daily note.
 * In a real plugin, use: await _app.vault.adapter.read(filePath);
 */
async function _conceptualReadDailyNoteContent(date: string): Promise<string | null> {
    const dailyNotePath = getDailyNotePath(date);
    try {
        // Placeholder: Simulating file read. Replace with actual API call if _app is available and configured.
        // For worker context where _app might not be available, this part needs to be handled by the main thread.
        if (_app && _app.vault && _app.vault.adapter) {
             const fileExists = await _app.vault.adapter.exists(dailyNotePath);
             if (fileExists) {
                return await _app.vault.adapter.read(dailyNotePath);
             }
             console.warn(`[Conceptual Read] Daily note ${dailyNotePath} not found.`);
             return null;
        }
        console.log(`[Conceptual Read] _app.vault.adapter not available. Simulating read for ${dailyNotePath}.`);
        // Fallback simulation if _app.vault.adapter is not available
        const simulatedContent = `---
date: ${date}
type: daily-note
time_blocks:
  - id: "sim-1"
    title: "Simulated Morning Task"
    startTime: "${date}T09:00:00"
    endTime: "${date}T10:00:00"
---
# Daily Content
`;
        if (date === "2023-10-27") return simulatedContent; // Example with data
        return `---
date: ${date}
type: daily-note
---
# Empty Note
`; // Simulate an empty note for other dates
    } catch (error) {
        console.error(`[Conceptual Read] Error reading daily note ${dailyNotePath}:`, error);
        return null;
    }
}

/**
 * Simulates writing the raw content back to a daily note.
 * In a real plugin, use: await _app.vault.adapter.write(filePath, newContent);
 */
async function _conceptualWriteDailyNoteContent(date: string, newContent: string): Promise<void> {
    const dailyNotePath = getDailyNotePath(date);
    try {
        // Placeholder: Simulating file write.
        if (_app && _app.vault && _app.vault.adapter) {
            await _app.vault.adapter.write(dailyNotePath, newContent);
            console.log(`[Conceptual Write] Successfully wrote to ${dailyNotePath} (using _app.vault.adapter)`);
            return;
        }
        console.log(`[Conceptual Write] _app.vault.adapter not available. Simulating write for ${dailyNotePath}. Content:`,newContent.substring(0,100) + "...");

    } catch (error) {
        console.error(`[Conceptual Write] Error writing daily note ${dailyNotePath}:`, error);
    }
}

/**
 * Extracts frontmatter and content from a markdown string.
 * A more robust solution would handle edge cases like --- within code blocks.
 */
function parseMarkdownWithFrontmatter(markdown: string): { frontmatter: any, content: string } {
    const fmMatch = markdown.match(/^---\s*([\s\S]*?)\s*---/);
    if (fmMatch && fmMatch[1]) {
        try {
            const frontmatter = yaml.load(fmMatch[1]);
            const content = markdown.substring(fmMatch[0].length).trimStart();
            return { frontmatter, content };
        } catch (e) {
            console.error("Error parsing YAML frontmatter:", e);
            return { frontmatter: {}, content: markdown }; // Return original content if frontmatter parsing fails
        }
    }
    return { frontmatter: {}, content: markdown };
}

/**
 * Combines frontmatter and content back into a markdown string.
 */
function stringifyMarkdownWithFrontmatter(frontmatter: any, content: string): string {
    // Ensure no undefined values in frontmatter which yaml.dump might handle poorly or differently than Obsidian
    const cleanFrontmatter = JSON.parse(JSON.stringify(frontmatter));
    const fmString = yaml.dump(cleanFrontmatter, { skipInvalid: true, indent: 2 });
    return `---
${fmString}---
${content}`;
}


// --- Core Functions ---

export async function getTimeBlocks(date: string, currentApp?: App): Promise<TimeBlock[]> {
    const appInstance = currentApp || _app;
    if (!appInstance || !appInstance.metadataCache || !appInstance.vault) {
        console.warn("[getTimeBlocks] Obsidian App instance not available. Using conceptual read.");
        // Conceptual/Simulated path when Obsidian API is not available
        const rawContent = await _conceptualReadDailyNoteContent(date);
        if (!rawContent) return [];
        const { frontmatter } = parseMarkdownWithFrontmatter(rawContent);
        return frontmatter.time_blocks || [];
    }

    // Obsidian API path
    const dailyNotePath = getDailyNotePath(date);
    const file = appInstance.vault.getAbstractFileByPath(dailyNotePath);

    if (file instanceof TFile) {
        const cache: FrontMatterCache | null = appInstance.metadataCache.getFileCache(file);
        const timeBlocks = cache?.frontmatter?.time_blocks;
        if (Array.isArray(timeBlocks)) {
            return timeBlocks.map((block: any) => block as TimeBlock); // Basic type assertion
        }
        return [];
    }
    console.warn(`[getTimeBlocks] Daily note not found or not a TFile: ${dailyNotePath}`);
    return [];
}

export async function saveTimeBlock(date: string, block: TimeBlock, currentApp?: App): Promise<void> {
    const appInstance = currentApp || _app;
    if (!appInstance || !appInstance.fileManager || !appInstance.vault) {
        console.warn("[saveTimeBlock] Obsidian App instance not available. Using conceptual read/write.");
        // Conceptual/Simulated path
        const rawContent = await _conceptualReadDailyNoteContent(date) || `---
date: ${date}
type: daily-note
---
`; // Default if note doesn't exist
        let { frontmatter, content } = parseMarkdownWithFrontmatter(rawContent);
        frontmatter.time_blocks = frontmatter.time_blocks || [];
        const index = frontmatter.time_blocks.findIndex((b: TimeBlock) => b.id === block.id);
        if (index > -1) {
            frontmatter.time_blocks[index] = block;
        } else {
            frontmatter.time_blocks.push(block);
        }
        const newFileContent = stringifyMarkdownWithFrontmatter(frontmatter, content);
        await _conceptualWriteDailyNoteContent(date, newFileContent);
        return;
    }

    // Obsidian API path
    const dailyNotePath = getDailyNotePath(date);
    let file = appInstance.vault.getAbstractFileByPath(dailyNotePath);

    if (!(file instanceof TFile)) {
        // File doesn't exist, create it with basic frontmatter
        console.log(`[saveTimeBlock] Daily note ${dailyNotePath} not found. Creating it.`);
        try {
            const defaultContent = `---
date: ${date}
type: daily-note
time_blocks: []
---

# ${date}
`;
            file = await appInstance.vault.create(dailyNotePath, defaultContent);
            if (!(file instanceof TFile)) {
                 console.error("[saveTimeBlock] Failed to create daily note:", dailyNotePath);
                 return;
            }
        } catch (e) {
            console.error("[saveTimeBlock] Error creating daily note:", e);
            return;
        }
    }
    
    // file is guaranteed to be TFile here
    await appInstance.fileManager.processFrontMatter(file as TFile, (fm) => {
        fm.time_blocks = fm.time_blocks || [];
        // Ensure it's an array, defensive coding
        if (!Array.isArray(fm.time_blocks)) {
            console.warn("[saveTimeBlock] time_blocks was not an array, re-initializing.");
            fm.time_blocks = [];
        }
        const index = fm.time_blocks.findIndex((b: any) => b.id === block.id);
        if (index > -1) {
            fm.time_blocks[index] = block;
        } else {
            fm.time_blocks.push(block);
        }
    });
    console.log(`[saveTimeBlock] Time block ${block.id} saved to ${dailyNotePath}`);
}

export async function deleteTimeBlock(date: string, blockId: string, currentApp?: App): Promise<void> {
    const appInstance = currentApp || _app;

    if (!appInstance || !appInstance.fileManager || !appInstance.vault) {
        console.warn("[deleteTimeBlock] Obsidian App instance not available. Using conceptual read/write.");
        // Conceptual/Simulated path
        const rawContent = await _conceptualReadDailyNoteContent(date);
        if (!rawContent) {
            console.warn(`[deleteTimeBlock] No content for ${date}, nothing to delete.`);
            return;
        }
        let { frontmatter, content } = parseMarkdownWithFrontmatter(rawContent);
        if (frontmatter.time_blocks && Array.isArray(frontmatter.time_blocks)) {
            frontmatter.time_blocks = frontmatter.time_blocks.filter((b: TimeBlock) => b.id !== blockId);
            const newFileContent = stringifyMarkdownWithFrontmatter(frontmatter, content);
            await _conceptualWriteDailyNoteContent(date, newFileContent);
        }
        return;
    }

    // Obsidian API path
    const dailyNotePath = getDailyNotePath(date);
    const file = appInstance.vault.getAbstractFileByPath(dailyNotePath);

    if (file instanceof TFile) {
        await appInstance.fileManager.processFrontMatter(file, (fm) => {
            if (fm.time_blocks && Array.isArray(fm.time_blocks)) {
                fm.time_blocks = fm.time_blocks.filter((b: any) => b.id !== blockId);
            } else {
                 console.warn(`[deleteTimeBlock] No time_blocks array found in ${dailyNotePath} or not an array.`);
            }
        });
        console.log(`[deleteTimeBlock] Time block ${blockId} deleted from ${dailyNotePath}`);
    } else {
        console.warn(`[deleteTimeBlock] Daily note not found: ${dailyNotePath}`);
    }
}
