// src/modules/finance/SubscriptionManager.ts
import { App, TFile, normalizePath, Notice } from 'obsidian';

export interface Subscription {
    serviceName: string;
    renewalDate: string; // "YYYY-MM-DD"
    amount: number;
    billingCycle: string; // "Monthly", "Annually", etc.
    category: string;
    status: string;     // "Active", "Cancelled", "Trial"
    notes?: string;
}

const SUBSCRIPTION_FILE_PATH = "finance/subscriptions.md";
const EXPECTED_COLUMNS = 7; // Number of columns in the markdown table

export function getSubscriptionFilePath(): string {
    return normalizePath(SUBSCRIPTION_FILE_PATH);
}

export async function loadSubscriptions(app: App): Promise<Subscription[]> {
    const filePath = getSubscriptionFilePath();
    let file = app.vault.getAbstractFileByPath(filePath);

    if (!(file instanceof TFile)) {
        const placeholderContent = `| Service Name | Renewal Date | Amount | Billing Cycle | Category | Status | Notes |
|---|---|---|---|---|---|---|
| Example Subscription | ${new Date().toISOString().slice(0,10)} | 9.99 | Monthly | Software | Active | Initial example |
`;
        try {
            await app.vault.create(filePath, placeholderContent);
            new Notice(`Created placeholder subscriptions file at: ${filePath}`);
            file = app.vault.getAbstractFileByPath(filePath); // Re-fetch
            if (!(file instanceof TFile)) {
                console.error("Failed to create or find subscriptions.md even after creation attempt.");
                return [];
            }
        } catch (err) {
            console.error(`Error creating subscriptions file at ${filePath}:`, err);
            return [];
        }
    }

    const subscriptions: Subscription[] = [];
    try {
        const content = await app.vault.read(file as TFile);
        const lines = content.split('\n');

        // Skip header (line 0) and separator (line 1)
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line.startsWith('|') || !line.endsWith('|')) {
                if (line.length > 0) console.warn(`Skipping malformed line (no pipes): "${line}"`);
                continue; // Skip lines not starting/ending with '|' or empty lines
            }

            const cells = line.substring(1, line.length - 1).split('|').map(cell => cell.trim());

            if (cells.length < EXPECTED_COLUMNS -1) { // Notes column is optional, so allow one less
                 console.warn(`Skipping malformed line (not enough columns - expected ${EXPECTED_COLUMNS-1} to ${EXPECTED_COLUMNS}): "${line}"`);
                continue;
            }
            
            const amount = parseFloat(cells[2]);
            if (isNaN(amount)) {
                console.warn(`Skipping line due to invalid amount: "${line}"`);
                continue;
            }

            const subscription: Subscription = {
                serviceName: cells[0],
                renewalDate: cells[1],
                amount: amount,
                billingCycle: cells[3],
                category: cells[4],
                status: cells[5],
                notes: cells[6] || undefined, // Handle optional notes column
            };
            subscriptions.push(subscription);
        }
    } catch (err) {
        console.error(`Error reading or parsing subscriptions file ${filePath}:`, err);
    }
    return subscriptions;
}

export function getSubscriptionsNearingExpiry(subscriptions: Subscription[], daysAhead: number): Subscription[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysAhead);

    return subscriptions.filter(sub => {
        if (sub.status === "Cancelled") { // Or any other inactive status
            return false;
        }
        try {
            const renewalDateParts = sub.renewalDate.split('-').map(Number);
            if (renewalDateParts.length !== 3 || renewalDateParts.some(isNaN)) {
                console.warn(`Invalid renewal date format for subscription "${sub.serviceName}": ${sub.renewalDate}`);
                return false;
            }
            // Create Date object at UTC midnight to avoid timezone issues in comparison
            const renewalDateJs = new Date(Date.UTC(renewalDateParts[0], renewalDateParts[1] - 1, renewalDateParts[2]));
            
            return renewalDateJs >= today && renewalDateJs <= targetDate;
        } catch (e) {
            console.error(`Error parsing renewal date for subscription "${sub.serviceName}": ${sub.renewalDate}`, e);
            return false;
        }
    });
}
