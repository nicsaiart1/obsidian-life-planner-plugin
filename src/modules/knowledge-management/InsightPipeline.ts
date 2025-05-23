// src/modules/knowledge-management/InsightPipeline.ts
// (Conceptually InsightService, implemented in InsightPipeline.ts for consistency)

import { Insight } from './types';
import { v4 as uuidv4 } from 'uuid';
// Optional: import { getSource } from './ReadingTracker'; // If strict validation of sourceId is needed

// In-memory store for Insights
let insights: Insight[] = [];

/**
 * Adds a new insight.
 * @param data - Object containing insight details.
 * @returns The newly created Insight object.
 */
export function addInsight(data: Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>): Insight {
    // Optional: Validate if data.sourceId exists using getSource(data.sourceId)
    // if (data.sourceId && !getSource(data.sourceId)) {
    //     console.error(`InsightPipeline: KnowledgeSource with ID ${data.sourceId} not found. Cannot add insight.`);
    //     // Depending on strictness, either throw error or proceed without linking
    // }

    const now = new Date().toISOString();
    const newInsight: Insight = {
        id: uuidv4(),
        ...data,
        createdAt: now,
        updatedAt: now,
    };
    insights.push(newInsight);
    return newInsight;
}

/**
 * Retrieves an insight by its ID.
 * @param id - The ID of the insight.
 * @returns The Insight object if found, otherwise undefined.
 */
export function getInsight(id: string): Insight | undefined {
    return insights.find(i => i.id === id);
}

/**
 * Updates an existing insight.
 * @param id - The ID of the insight to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated Insight object if found, otherwise undefined.
 */
export function updateInsight(
    id: string,
    updates: Partial<Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>>
): Insight | undefined {
    const insightIndex = insights.findIndex(i => i.id === id);
    if (insightIndex === -1) {
        return undefined;
    }

    // Optional: Validate if updates.sourceId exists if it's being changed
    // if (updates.sourceId && !getSource(updates.sourceId)) {
    //     console.error(`InsightPipeline: KnowledgeSource with ID ${updates.sourceId} not found. Cannot update insight linkage.`);
    // }
    
    insights[insightIndex] = {
        ...insights[insightIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    return insights[insightIndex];
}

/**
 * Deletes an insight by its ID.
 * @param id - The ID of the insight to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export function deleteInsight(id: string): boolean {
    const initialLength = insights.length;
    insights = insights.filter(i => i.id !== id);
    // Also, if this insight was in any relatedInsightIds of other insights, those links would be dangling.
    // A more robust system might clean these up.
    return insights.length < initialLength;
}

/**
 * Retrieves all insights, optionally filtered and sorted.
 * @param filter - Optional filter object { sourceId, tag }.
 * @param sortBy - Optional key of Insight to sort by. Default: 'createdAt' descending.
 * @returns An array of Insight objects.
 */
export function getAllInsights(
    filter?: { sourceId?: string; tag?: string },
    sortBy: keyof Insight = 'createdAt'
): Insight[] {
    let filteredInsights = [...insights];

    if (filter) {
        if (filter.sourceId) {
            filteredInsights = filteredInsights.filter(i => i.sourceId === filter.sourceId);
        }
        if (filter.tag) {
            filteredInsights = filteredInsights.filter(i => i.tags?.includes(filter.tag!));
        }
    }

    filteredInsights.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];

        if (valA === undefined && valB === undefined) return 0;
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;

        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
            return new Date(valB as string).getTime() - new Date(valA as string).getTime(); // Newest first
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB); // Default string sort (e.g., title, text)
        }
        
        if (valA! < valB!) return -1;
        if (valA! > valB!) return 1;
        return 0;
    });

    return filteredInsights;
}

/**
 * Retrieves all insights specifically linked to a given KnowledgeSource ID.
 * @param sourceId - The ID of the KnowledgeSource.
 * @returns An array of Insight objects, sorted by creation date (newest first).
 */
export function getInsightsForSource(sourceId: string): Insight[] {
    return getAllInsights({ sourceId: sourceId }, 'createdAt');
}


// Helper function to reset the in-memory store, useful for testing
export function _resetInsightsStore(): void {
    insights = [];
}

// Example Usage (for internal testing)
/*
_resetInsightsStore();
// Assume sourceId1 is a valid ID from KnowledgeSourceService (ReadingTracker)
const sourceId1 = "some-source-id"; 

addInsight({ text: "The quick brown fox jumps over the lazy dog.", sourceId: sourceId1, tags: ["example", "general"] });
const insight2 = addInsight({ title: "Key Concept", text: "E=mc^2 is profound.", sourceId: "another-source-id", context: "Chapter 3" });
addInsight({ text: "A fleeting thought without a source.", tags: ["random"] });


console.log("All Insights:", getAllInsights());
updateInsight(insight2.id, { text: "E=mc^2 is a cornerstone of modern physics.", relatedInsightIds: [insights[0].id] });
console.log("Updated Insight 2:", getInsight(insight2.id));
console.log("Insights for Source 1:", getInsightsForSource(sourceId1));
console.log("Insights tagged 'random':", getAllInsights({ tag: 'random' }, 'text')); // Sort by text
*/
