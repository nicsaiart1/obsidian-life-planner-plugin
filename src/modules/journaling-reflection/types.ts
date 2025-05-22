// src/modules/journaling-reflection/types.ts

export interface JournalEntry {
  id: string;
  date: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ (represents UTC)
  title?: string;
  content: string; // Markdown content
  promptId?: string; // ID of the prompt used, if any
  moodLogId?: string; // ID of the mood log associated with this entry, if any
  // Consider adding tags?: string[] later if needed
}

export interface Prompt {
  id: string;
  text: string;
  category?: string; // e.g., "Self-reflection", "Creativity", "Goal Setting"
  tags?: string[];
  isUsed?: boolean; // To track if a prompt has been used, for cycling through them
  createdAt: string; // ISO 8601 format
}

// Represents a type of mood that can be logged
export interface Mood {
  id: string;
  name: string; // e.g., "Happy", "Sad", "Productive", "Anxious", "Calm"
  color?: string; // Hex color code for UI representation (e.g., "#FFD700")
  // Potentially an icon field here too: icon?: string (e.g., emoji or icon name)
}

// Represents an instance of a mood being logged by the user
export interface MoodLog {
  id: string;
  date: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ (represents UTC)
  moodId: string; // ID of the Mood being logged
  intensity?: number; // Optional: scale of 1-5 or 1-10
  notes?: string; // Optional: brief notes about the mood or context
  // journalEntryId?: string; // Optional: if mood is directly tied to a specific journal entry
}
