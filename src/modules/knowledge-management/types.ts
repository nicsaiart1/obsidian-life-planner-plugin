// src/modules/knowledge-management/types.ts

export enum ContentType {
  BOOK = 'Book',
  ARTICLE = 'Article',
  VIDEO = 'Video',
  PODCAST = 'Podcast',
  COURSE = 'Course',
  RESEARCH_PAPER = 'Research Paper',
  DOCUMENTATION = 'Documentation',
  WEBSITE = 'Website',
  OTHER = 'Other',
}

export enum ContentStatus {
  BACKLOG = 'Backlog', // Yet to start
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold', // Temporarily paused
  DROPPED = 'Dropped', // Decided not to continue
  ARCHIVED = 'Archived', // Completed and archived, or not relevant now but kept
}

export interface KnowledgeSource {
  id: string;
  title: string;
  contentType: ContentType;
  authorOrCreator?: string;
  publicationYear?: number; // Year of publication/release
  sourceUrl?: string; // URL to the content if online (e.g., article, video, podcast)
  filePath?: string; // Path to a local file (PDF, ePub) or an Obsidian note about this source
  status: ContentStatus;
  rating?: number; // User's rating, e.g., 1-5 stars
  summary?: string; // User's brief summary or abstract of the content
  coverImage?: string; // URL or local path to a cover image
  tags?: string[];
  addedAt: string; // ISO 8601 DateTime string (when it was added to the tracker)
  updatedAt: string; // ISO 8601 DateTime string (last modification)
  startedAt?: string; // ISO 8601 DateTime string (when user started consuming)
  completedAt?: string; // ISO 8601 DateTime string (when user finished consuming)
}

export interface Insight {
  id: string;
  sourceId?: string; // Optional: links to KnowledgeSource.id if the insight is from a specific source
  title?: string; // Optional title for the insight itself
  text: string; // The core insight, can be Markdown formatted
  context?: string; // Where in the source this insight came from (e.g., page number, chapter, timestamp, section heading)
  linkedNotePath?: string; // Optional: path to a dedicated Obsidian note where this insight is elaborated or stored
  relatedInsightIds?: string[]; // IDs of other insights that are related to this one
  tags?: string[];
  createdAt: string; // ISO 8601 DateTime string
  updatedAt: string; // ISO 8601 DateTime string
}
