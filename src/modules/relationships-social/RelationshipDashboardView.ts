// src/modules/relationships-social/RelationshipDashboardView.ts
import type { Contact, InteractionLog } from './types';

export interface DashboardHighlights {
    upcomingBirthdays: Array<{ contactId: string, name: string, birthday: string, daysUntil: number }>;
    contactsToReconnect: Array<{ contactId: string, name: string, lastContactedDate?: string, communicationFrequency?: string }>;
    recentPositiveInteractions: InteractionLog[]; // Last 3-5 positive sentiment interactions
    // Could add more: e.g., relationship health scores, pending follow-ups
}

/**
 * Gathers and processes data to be displayed on a relationship dashboard.
 * This is a conceptual placeholder. A real implementation would involve more complex logic.
 * @param contacts - An array of all Contact objects.
 * @param interactions - An array of all InteractionLog objects.
 * @returns Data structured for the relationship dashboard.
 */
export function getRelationshipDashboardHighlights(
    contacts: Contact[],
    interactions: InteractionLog[]
): DashboardHighlights {
    console.log('Fetching relationship dashboard highlights (conceptual)');
    const today = new Date();
    today.setHours(0,0,0,0);

    const upcomingBirthdays: DashboardHighlights['upcomingBirthdays'] = [];
    contacts.forEach(contact => {
        if (contact.birthday) {
            const birthDate = new Date(contact.birthday);
            birthDate.setFullYear(today.getFullYear()); // Check for this year's birthday
            if (birthDate < today) { // If already passed this year, check next year
                birthDate.setFullYear(today.getFullYear() + 1);
            }
            const daysUntil = Math.ceil((birthDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            if (daysUntil >= 0 && daysUntil <= 30) { // Birthdays in the next 30 days
                upcomingBirthdays.push({ contactId: contact.id, name: contact.name, birthday: contact.birthday, daysUntil });
            }
        }
    });
    upcomingBirthdays.sort((a,b) => a.daysUntil - b.daysUntil);

    const contactsToReconnect: DashboardHighlights['contactsToReconnect'] = [];
    // Basic logic: if lastContactedDate is older than communicationFrequency (simplified)
    // A more robust logic would parse communicationFrequency (e.g., "Weekly" -> 7 days)
    contacts.filter(c => c.communicationFrequency && c.lastContactedDate).forEach(contact => {
        const lastDate = new Date(contact.lastContactedDate!);
        let thresholdDays = 90; // Default for "Quarterly" or if parsing fails
        if (contact.communicationFrequency?.toLowerCase() === 'weekly') thresholdDays = 7;
        else if (contact.communicationFrequency?.toLowerCase() === 'monthly') thresholdDays = 30;
        
        const daysSinceLastContact = (today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
        if (daysSinceLastContact > thresholdDays) {
             contactsToReconnect.push({ contactId: contact.id, name: contact.name, lastContactedDate: contact.lastContactedDate, communicationFrequency: contact.communicationFrequency});
        }
    });


    const recentPositiveInteractions = interactions
        .filter(interaction => interaction.sentiment === 'Positive')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return { 
        upcomingBirthdays, 
        contactsToReconnect,
        recentPositiveInteractions
    };
}
