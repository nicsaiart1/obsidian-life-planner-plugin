// src/modules/knowledge-management/ReadingTracker.ts
// (Conceptually KnowledgeSourceService, implemented in ReadingTracker.ts for consistency with existing file names)

import { KnowledgeSource, ContentType, ContentStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for KnowledgeSources
let sources: KnowledgeSource[] = [];

/**
 * Adds a new knowledge source.
 * @param data - Object containing source details.
 * @returns The newly created KnowledgeSource object.
 */
export function addSource(data: Omit<KnowledgeSource, 'id' | 'addedAt' | 'updatedAt'>): KnowledgeSource {
    const now = new Date().toISOString();
    const newSource: KnowledgeSource = {
        id: uuidv4(),
        ...data,
        addedAt: now,
        updatedAt: now,
    };
    sources.push(newSource);
    return newSource;
}

/**
 * Retrieves a knowledge source by its ID.
 * @param id - The ID of the source.
 * @returns The KnowledgeSource object if found, otherwise undefined.
 */
export function getSource(id: string): KnowledgeSource | undefined {
    return sources.find(s => s.id === id);
}

/**
 * Updates an existing knowledge source.
 * Manages `startedAt` and `completedAt` based on status changes.
 * @param id - The ID of the source to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated KnowledgeSource object if found, otherwise undefined.
 */
export function updateSource(
    id: string,
    updates: Partial<Omit<KnowledgeSource, 'id' | 'addedAt' | 'updatedAt'>>
): KnowledgeSource | undefined {
    const sourceIndex = sources.findIndex(s => s.id === id);
    if (sourceIndex === -1) {
        return undefined;
    }

    const originalSource = sources[sourceIndex];
    const now = new Date().toISOString();
    
    let startedAt = originalSource.startedAt;
    let completedAt = originalSource.completedAt;

    if (updates.status) {
        if (updates.status === ContentStatus.IN_PROGRESS && !originalSource.startedAt) {
            startedAt = now; // Set startedAt if moving to In Progress for the first time
        }
        if (updates.status === ContentStatus.COMPLETED && !originalSource.completedAt) {
            completedAt = now; // Set completedAt if moving to Completed
            if (!startedAt) startedAt = now; // If it was completed from a non-started state
        } else if (updates.status !== ContentStatus.COMPLETED) {
            completedAt = undefined; // Clear completedAt if moved out of Completed status
        }
    }
    
    sources[sourceIndex] = {
        ...originalSource,
        ...updates,
        startedAt,
        completedAt,
        updatedAt: now,
    };
    return sources[sourceIndex];
}

/**
 * Deletes a knowledge source by its ID.
 * (Consider implications for linked Insights - for now, they will be orphaned).
 * @param id - The ID of the source to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export function deleteSource(id: string): boolean {
    const initialLength = sources.length;
    sources = sources.filter(s => s.id !== id);
    // TODO: Consider cascading delete or disassociation for Insights in InsightService
    return sources.length < initialLength;
}

/**
 * Retrieves all knowledge sources, optionally filtered and sorted.
 * @param filter - Optional filter object { contentType, status, tag }.
 * @param sortBy - Optional key of KnowledgeSource to sort by. Default: 'addedAt' descending.
 * @returns An array of KnowledgeSource objects.
 */
export function getAllSources(
    filter?: { contentType?: ContentType; status?: ContentStatus; tag?: string },
    sortBy: keyof KnowledgeSource = 'addedAt'
): KnowledgeSource[] {
    let filteredSources = [...sources];

    if (filter) {
        if (filter.contentType) {
            filteredSources = filteredSources.filter(s => s.contentType === filter.contentType);
        }
        if (filter.status) {
            filteredSources = filteredSources.filter(s => s.status === filter.status);
        }
        if (filter.tag) {
            filteredSources = filteredSources.filter(s => s.tags?.includes(filter.tag!));
        }
    }

    filteredSources.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];

        if (valA === undefined && valB === undefined) return 0;
        if (valA === undefined) return 1; // Sort undefined/null to the end
        if (valB === undefined) return -1;
        
        // Date fields: addedAt, updatedAt, startedAt, completedAt - sort newest first
        if (['addedAt', 'updatedAt', 'startedAt', 'completedAt'].includes(sortBy)) {
            return new Date(valB as string).getTime() - new Date(valA as string).getTime();
        }
        // Publication Year: newest (largest year) first
        if (sortBy === 'publicationYear') {
            return (valB as number) - (valA as number);
        }
        // Rating: highest first
        if (sortBy === 'rating') {
            return (valB as number) - (valA as number);
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB); // Default string sort (e.g., title, author)
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
            return valA - valB; // Default number sort
        }
        
        if (valA! < valB!) return -1;
        if (valA! > valB!) return 1;
        return 0;
    });

    return filteredSources;
}

// Helper function to reset the in-memory store, useful for testing
export function _resetSourcesStore(): void {
    sources = [];
}

// Example Usage (for internal testing)
/*
_resetSourcesStore();
addSource({ title: "Sapiens", contentType: ContentType.BOOK, authorOrCreator: "Yuval Noah Harari", status: ContentStatus.BACKLOG, tags: ["history", "anthropology"] });
addSource({ title: "Obsidian Flight School", contentType: ContentType.COURSE, sourceUrl: "https://www.youtube.com/playlist?list=PL7o0SquRaa_Zg_dqtR6I-ebdYgV2FESL8", status: ContentStatus.IN_PROGRESS });
const article = addSource({ title: "The Future of AI", contentType: ContentType.ARTICLE, status: ContentStatus.COMPLETED, publicationYear: 2023, rating: 5 });

console.log("All Sources:", getAllSources());
updateSource(article.id, { summary: "A comprehensive look at upcoming AI trends." });
console.log("Updated Article:", getSource(article.id));
console.log("Books:", getAllSources({ contentType: ContentType.BOOK }));
console.log("Completed items:", getAllSources({ status: ContentStatus.COMPLETED }, 'title')); // Sort by title
*/
