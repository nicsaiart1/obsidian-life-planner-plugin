// src/modules/relationships-social/ContactService.ts
import { Contact } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for contacts
let contacts: Contact[] = [];

/**
 * Adds a new contact.
 * @param data - Object containing contact details. `lastContactedDate` is optional and managed internally.
 * @returns The newly created Contact object.
 */
export function addContact(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'lastContactedDate'>): Contact {
    const now = new Date().toISOString();
    const newContact: Contact = {
        id: uuidv4(),
        ...data,
        createdAt: now,
        updatedAt: now,
        // lastContactedDate will be updated via InteractionLogService typically
    };
    contacts.push(newContact);
    return newContact;
}

/**
 * Retrieves a contact by its ID.
 * @param id - The ID of the contact.
 * @returns The Contact object if found, otherwise undefined.
 */
export function getContact(id: string): Contact | undefined {
    return contacts.find(c => c.id === id);
}

/**
 * Updates an existing contact.
 * @param id - The ID of the contact to update.
 * @param updates - An object containing the fields to update. `lastContactedDate` can be updated here.
 * @returns The updated Contact object if found, otherwise undefined.
 */
export function updateContact(
    id: string,
    updates: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>> // Allow lastContactedDate to be updated
): Contact | undefined {
    const contactIndex = contacts.findIndex(c => c.id === id);
    if (contactIndex === -1) {
        return undefined;
    }
    const originalContact = contacts[contactIndex];
    contacts[contactIndex] = {
        ...originalContact,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    return contacts[contactIndex];
}

/**
 * Deletes a contact by its ID.
 * Also consider what to do with InteractionLogs associated with this contact.
 * For this phase, logs will be orphaned.
 * @param id - The ID of the contact to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export function deleteContact(id: string): boolean {
    const initialLength = contacts.length;
    contacts = contacts.filter(c => c.id !== id);
    // TODO: Consider cascading delete or disassociation for InteractionLogs in InteractionLogService
    return contacts.length < initialLength;
}

/**
 * Retrieves all contacts, optionally sorted and filtered.
 * @param sortBy - Optional key of Contact to sort by (e.g., 'name', 'lastContactedDate'). Default: 'name' ascending.
 * @param filter - Optional filter object, e.g., { relationshipType: 'Friend' }.
 * @returns An array of Contact objects.
 */
export function getAllContacts(
    sortBy: keyof Contact = 'name',
    filter?: { relationshipType?: string; tag?: string }
): Contact[] {
    let filteredContacts = [...contacts];

    if (filter) {
        if (filter.relationshipType) {
            filteredContacts = filteredContacts.filter(c => c.relationshipType === filter.relationshipType);
        }
        if (filter.tag) {
            filteredContacts = filteredContacts.filter(c => c.tags?.includes(filter.tag!));
        }
    }

    filteredContacts.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];

        if (valA === undefined && valB === undefined) return 0;
        if (valA === undefined) return 1; // Sort undefined/null to the end
        if (valB === undefined) return -1;

        if (sortBy === 'lastContactedDate' || sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'birthday') {
            // Sort dates: newest first for lastContactedDate, oldest first for birthday/createdAt
            const dateA = new Date(valA as string).getTime();
            const dateB = new Date(valB as string).getTime();
            return sortBy === 'lastContactedDate' ? dateB - dateA : dateA - dateB;
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
            return valA - valB;
        }
        // Fallback for other types or mixed types
        if (valA! < valB!) return -1;
        if (valA! > valB!) return 1;
        return 0;
    });

    return filteredContacts;
}

// Helper function to reset the in-memory store, useful for testing
export function _resetContactsStore(): void {
    contacts = [];
}

// Example Usage (for internal testing)
/*
_resetContactsStore();
const contact1 = addContact({ name: "Alice Wonderland", email: "alice@example.com", relationshipType: "Friend" });
const contact2 = addContact({ name: "Bob The Builder", company: "Construction Co.", relationshipType: "Colleague", communicationFrequency: "Weekly" });
addContact({ name: "Charlie Brown", birthday: "1950-10-04", relationshipType: "Acquaintance" });

console.log("All Contacts (sorted by name):", getAllContacts());
updateContact(contact1.id, { phone: "123-456-7890", lastContactedDate: new Date().toISOString() });
console.log("Alice Updated:", getContact(contact1.id));
console.log("Friends:", getAllContacts(undefined, { relationshipType: "Friend" }));

// Simulate adding a tag and filtering by it
updateContact(contact2.id, { tags: ["project-x"] });
console.log("Contacts tagged 'project-x':", getAllContacts(undefined, { tag: "project-x" }));
*/
