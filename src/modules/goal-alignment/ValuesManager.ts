// src/modules/goal-alignment/ValuesManager.ts
import { App, TFile, normalizePath } from 'obsidian';

const VALUES_FILE_PATH = "life-planner/values.md"; // Path relative to vault root

/**
 * Returns the standardized path to the personal values file.
 */
export function getValuesFilePath(): string {
    return normalizePath(VALUES_FILE_PATH);
}

/**
 * Loads personal values from the 'life-planner/values.md' file.
 * Each line or bullet point in the file is treated as a distinct value.
 * Creates a placeholder file if it doesn't exist.
 * @param app - The Obsidian App instance.
 * @returns A promise that resolves to an array of value strings.
 */
export async function loadValues(app: App): Promise<string[]> {
    const filePath = getValuesFilePath();
    let file = app.vault.getAbstractFileByPath(filePath);

    if (!(file instanceof TFile)) {
        // File doesn't exist, create a placeholder
        try {
            const placeholderContent = `# My Personal Values

- Value 1
- Value 2
- Value 3

(Edit this file to list your core personal values, one per line or bullet point.)`;
            await app.vault.create(filePath, placeholderContent);
            console.log(`Created placeholder values file at: ${filePath}`);
            file = app.vault.getAbstractFileByPath(filePath); // Re-fetch the file
            if (!(file instanceof TFile)) { // Should exist now
                console.error("Failed to create or find values.md even after creation attempt.");
                return [];
            }
        } catch (err) {
            console.error(`Error creating values file at ${filePath}:`, err);
            return []; // Return empty if creation fails
        }
    }

    try {
        const content = await app.vault.read(file as TFile);
        const values = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0) // Ignore empty lines
            .map(line => {
                // Remove leading bullet points or hyphens if present
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return line.substring(2).trim();
                }
                return line;
            })
            .filter(line => line.length > 0 && !line.startsWith('#')); // Ignore empty lines after processing and comments
        return values;
    } catch (err) {
        console.error(`Error reading values file ${filePath}:`, err);
        return []; // Return empty array on error
    }
}
