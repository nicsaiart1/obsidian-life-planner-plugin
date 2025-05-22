// src/modules/journaling-reflection/PromptBank.ts
import { Prompt } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for prompts
let prompts: Prompt[] = [];

/**
 * Adds a new prompt to the bank.
 * @param text - The text of the prompt.
 * @param category - Optional category for the prompt.
 * @param tags - Optional array of tags.
 * @returns The newly created Prompt object.
 */
export function addPrompt(text: string, category?: string, tags?: string[]): Prompt {
    const newPrompt: Prompt = {
        id: uuidv4(),
        text,
        category,
        tags,
        isUsed: false,
        createdAt: new Date().toISOString(),
    };
    prompts.push(newPrompt);
    return newPrompt;
}

/**
 * Retrieves a prompt by its ID.
 * @param id - The ID of the prompt to retrieve.
 * @returns The Prompt object if found, otherwise undefined.
 */
export function getPromptById(id: string): Prompt | undefined {
    return prompts.find(p => p.id === id);
}

/**
 * Retrieves a random prompt, optionally filtered by category and usage status.
 * @param category - Optional category to filter by.
 * @param includeUsed - If false, only returns prompts not marked as used. Defaults to false.
 * @returns A random Prompt object if one is found, otherwise undefined.
 */
export function getRandomPrompt(category?: string, includeUsed: boolean = false): Prompt | undefined {
    let availablePrompts = prompts;

    if (!includeUsed) {
        availablePrompts = availablePrompts.filter(p => !p.isUsed);
    }

    if (category) {
        availablePrompts = availablePrompts.filter(p => p.category === category);
    }

    if (availablePrompts.length === 0) {
        // If no unused prompts and includeUsed is false, try to reset used status or return from all prompts
        if (!includeUsed && prompts.some(p => p.category === category || !category)) { // Check if any prompts exist in this category at all
             // Option 1: Reset isUsed for all prompts in this category if all are used
            // prompts.filter(p=>(p.category === category || !category)).forEach(p => p.isUsed = false);
            // availablePrompts = prompts.filter(p => !p.isUsed && (p.category === category || !category));
            // Option 2: Fallback to selecting from used prompts if no unused are left (as if includeUsed was true)
            availablePrompts = prompts.filter(p => p.category === category || !category);

        } else if (availablePrompts.length === 0) {
            return undefined; // No prompts match criteria
        }
    }
    
    if (availablePrompts.length === 0) return undefined;


    const randomIndex = Math.floor(Math.random() * availablePrompts.length);
    return availablePrompts[randomIndex];
}

/**
 * Retrieves prompts based on category and/or tags.
 * @param filter - An object with optional category and/or tag.
 *                 - category: Filter by category.
 *                 - tag: Filter by a single tag (prompts must include this tag).
 * @returns An array of Prompt objects matching the filter.
 */
export function getPrompts(filter: { category?: string; tag?: string } = {}): Prompt[] {
    let filteredPrompts = prompts;

    if (filter.category) {
        filteredPrompts = filteredPrompts.filter(p => p.category === filter.category);
    }

    if (filter.tag) {
        filteredPrompts = filteredPrompts.filter(p => p.tags?.includes(filter.tag!));
    }

    return [...filteredPrompts];
}

/**
 * Marks a prompt as used.
 * @param id - The ID of the prompt to mark as used.
 * @returns The updated Prompt object if found and marked, otherwise undefined.
 */
export function markPromptAsUsed(id: string): Prompt | undefined {
    const prompt = getPromptById(id);
    if (prompt) {
        prompt.isUsed = true;
        // No actual update to a persistent store here, just modifying the in-memory object.
        // If using a real DB, this would be an update operation.
        return prompt;
    }
    return undefined;
}

/**
 * Resets the 'isUsed' status of all prompts, or those in a specific category.
 * @param category - Optional category. If provided, only prompts in this category are reset.
 */
export function resetAllPromptsUsage(category?: string): void {
    prompts.forEach(p => {
        if (!category || p.category === category) {
            p.isUsed = false;
        }
    });
}


/**
 * Retrieves all prompts.
 * @returns An array of all Prompt objects.
 */
export function getAllPrompts(): Prompt[] {
    return [...prompts];
}

// Helper function to reset the in-memory store and add default prompts
export function _initializePromptBank() {
    prompts = []; // Clear existing prompts
    // Add some default prompts
    addPrompt("What was the highlight of your day?", "Daily Reflection", ["gratitude", "positivity"]);
    addPrompt("Describe a challenge you faced recently and how you handled it.", "Problem Solving", ["resilience", "learning"]);
    addPrompt("What are you grateful for today?", "Gratitude", ["positivity"]);
    addPrompt("If you could achieve one thing this week, what would it be and why?", "Goal Setting", ["planning", "motivation"]);
    addPrompt("What's something new you learned recently?", "Learning", ["curiosity"]);
    addPrompt("How are you feeling right now, and what might be contributing to that?", "Self-awareness", ["emotions"]);
    addPrompt("Describe a moment when you felt truly creative.", "Creativity", ["inspiration"]);
}

// Initialize with default prompts when the module loads
_initializePromptBank();

// Example Usage (for internal testing if needed)
/*
console.log("All Prompts:", getAllPrompts());
console.log("Random Daily Reflection Prompt:", getRandomPrompt("Daily Reflection"));
const creativePrompt = getRandomPrompt("Creativity");
if (creativePrompt) {
    markPromptAsUsed(creativePrompt.id);
    console.log("Used Creative Prompt:", creativePrompt);
    console.log("Another random creative prompt (likely different or undefined if only one):", getRandomPrompt("Creativity"));
    resetAllPromptsUsage("Creativity");
    console.log("Random creative prompt after reset:", getRandomPrompt("Creativity"));
}
console.log("Prompts tagged 'learning':", getPrompts({tag: "learning"}));
*/
