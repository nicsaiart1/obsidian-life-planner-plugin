// src/modules/relationships-social/types.ts

export enum InteractionType {
  CALL = 'Call',
  TEXT_MESSAGE = 'Text Message',
  EMAIL = 'Email',
  IN_PERSON_MEETING = 'In-Person Meeting',
  VIRTUAL_MEETING = 'Virtual Meeting',
  SOCIAL_MEDIA = 'Social Media DMs/Interaction',
  EVENT = 'Event Attended Together',
  HANGOUT = 'Hangout/Social Visit',
  OTHER = 'Other',
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string; // Could be a simple string or a structured address object
  company?: string;
  role?: string; // Their role/job title
  birthday?: string; // YYYY-MM-DD
  relationshipType?: string; // e.g., 'Family', 'Friend', 'Colleague', 'Mentor', 'Acquaintance', 'Network'
  communicationFrequency?: string; // User-defined preferred frequency, e.g., 'Weekly', 'Monthly', 'Bi-Monthly', 'Quarterly', 'Annually'
  lastContactedDate?: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
  notes?: string; // General notes about the contact
  tags?: string[]; // e.g., ['Tech', 'BookClub', 'University']
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

export interface InteractionLog {
  id: string;
  contactId: string; // Links to Contact.id
  date: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ (when the interaction occurred)
  type: InteractionType;
  description: string; // Summary of what happened or was discussed
  keyTakeaways?: string;
  followUpActions?: string; // What needs to be done next, if anything
  sentiment?: 'Positive' | 'Neutral' | 'Negative'; // Optional: user's perception of the interaction
  // location?: string; // Optional: where the interaction took place
  createdAt: string; // ISO 8601 format (when the log entry was created)
}
