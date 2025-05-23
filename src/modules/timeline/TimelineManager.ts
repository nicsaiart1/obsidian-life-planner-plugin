// src/modules/timeline/TimelineManager.ts
import { Vault, TFile, moment, FrontMatterCache, TFolder } from 'obsidian';

export interface LifeEvent {
    date: Date;
    type: string; // Corresponds to eventType from frontmatter
    title: string;
    description: string;
    icon?: string;
    // Optional: store original path for linking back or debugging
    filePath?: string; 
}

interface EventFrontmatter {
    eventType?: string;
    eventDate?: string;
    eventTitle?: string;
    eventDescription?: string;
    eventIcon?: string;
}

const EVENTS_FOLDER_PATH = 'events/'; // Configurable in a real plugin

/**
 * Scans markdown files in the 'events/' folder to extract life event data.
 * Each file in the folder is assumed to be an event.
 * Parses YAML frontmatter for event details.
 */
export async function getLifeEvents(vault: Vault): Promise<LifeEvent[]> {
    const lifeEvents: LifeEvent[] = [];
    
    const eventsFolder = vault.getAbstractFileByPath(EVENTS_FOLDER_PATH);
    if (!(eventsFolder instanceof TFolder)) {
        console.warn(`Events folder '${EVENTS_FOLDER_PATH}' not found or is not a folder.`);
        return [];
    }

    const eventFiles = eventsFolder.children.filter(file => file instanceof TFile && file.extension === 'md') as TFile[];

    for (const file of eventFiles) {
        try {
            const fileCache = await vault.metadataCache.getFileCache(file);
            const frontmatter = fileCache?.frontmatter as EventFrontmatter | undefined;

            if (!frontmatter) {
                // console.log(`No frontmatter in event file: ${file.path}`);
                continue;
            }

            const { eventDate, eventTitle, eventType, eventDescription, eventIcon } = frontmatter;

            if (!eventDate || !eventTitle) {
                console.warn(`Event file ${file.path} is missing required fields 'eventDate' or 'eventTitle'. Skipping.`);
                continue;
            }

            const dateMoment = moment(eventDate, 'YYYY-MM-DD', true); // true for strict parsing
            if (!dateMoment.isValid()) {
                console.warn(`Invalid eventDate format '${eventDate}' in ${file.path}. Expected YYYY-MM-DD. Skipping.`);
                continue;
            }

            lifeEvents.push({
                date: dateMoment.toDate(),
                type: eventType || 'General', // Default type if not specified
                title: eventTitle,
                description: eventDescription || '', // Default empty description
                icon: eventIcon,
                filePath: file.path
            });

        } catch (error) {
            console.error(`Error processing event file ${file.path}:`, error);
            // Continue to next file
        }
    }

    // Sort events chronologically by date
    lifeEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return lifeEvents;
}
