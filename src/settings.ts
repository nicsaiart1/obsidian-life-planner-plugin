// src/settings.ts
import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import LifePlannerPlugin from '../main'; // Adjust path if main.ts is elsewhere
import { generateSalt, deriveKey, encryptString, decryptString } from '../utils/encryption';

export interface LifePlannerSettings {
    enableTimeManagement: boolean;
    enableHabitsRoutines: boolean;
    enableGoalAlignment: boolean;
    enableJournaling: boolean; // Added for the placeholder

    // Security and API Key Management
    pluginPasswordAttemptCounter: number;
    pluginPasswordSalt: string;
    encryptedGptApiKey: string;
    encryptedGoogleCalendarApiKey: string;
    encryptedAppleCalendarApiKey: string; // Based on ARCHITECTURE.md
    encryptedGoogleFitApiKey: string;     // Based on ARCHITECTURE.md
    encryptedAppleHealthApiKey: string;   // Based on ARCHITECTURE.md (though might be CSV based)
    // Add more encrypted key fields as needed based on ARCHITECTURE.MD integrations
    // For example, if Whisper integration implies a key:
    // encryptedWhisperApiKey: string;
}

export const DEFAULT_SETTINGS: LifePlannerSettings = {
    enableTimeManagement: true,
    enableHabitsRoutines: true,
    enableGoalAlignment: true,
    enableJournaling: true, // Added for the placeholder

    // Security and API Key Management
    pluginPasswordAttemptCounter: 0,
    pluginPasswordSalt: "",
    encryptedGptApiKey: "",
    encryptedGoogleCalendarApiKey: "",
    encryptedAppleCalendarApiKey: "",
    encryptedGoogleFitApiKey: "",
    encryptedAppleHealthApiKey: "",
    // encryptedWhisperApiKey: "",
};

export class LifePlannerSettingTab extends PluginSettingTab {
    plugin: LifePlannerPlugin;
    private tempPassword?: string; // Store password temporarily for key derivation
    private apiKeysToUpdate: { [key: string]: string } = {}; // Temporarily store API keys to be encrypted

    constructor(app: App, plugin: LifePlannerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async savePluginSettings() {
        if (this.tempPassword && this.plugin.settings.pluginPasswordSalt) {
            try {
                const key = await deriveKey(this.tempPassword, this.plugin.settings.pluginPasswordSalt);
                for (const apiKeyName in this.apiKeysToUpdate) {
                    if (this.apiKeysToUpdate[apiKeyName]) {
                        (this.plugin.settings as any)[apiKeyName] = await encryptString(this.apiKeysToUpdate[apiKeyName], key);
                    }
                }
                new Notice('API keys encrypted and settings saved.');
            } catch (error) {
                new Notice('Failed to encrypt API keys. Password might be incorrect or data corrupted.');
                console.error("Encryption error on save:", error);
                // Do not save if encryption fails, or save settings without encrypted keys?
                // For now, we proceed to save other settings, but keys won't be updated if encryption failed.
            }
        } else if (Object.keys(this.apiKeysToUpdate).some(key => this.apiKeysToUpdate[key])) {
            // Only show this notice if there were actual attempts to set API keys without a password
            new Notice('Plugin password not set. API keys will not be encrypted or saved.');
        }

        this.apiKeysToUpdate = {}; // Clear temp keys
        // this.tempPassword = undefined; // Clear temp password immediately after use is crucial

        await this.plugin.saveSettings();
        this.display(); // Refresh display to show placeholders or clear inputs
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Life Planner Settings' });

        // Module Toggles (existing settings)
        containerEl.createEl('h3', { text: 'Module Management' });
        new Setting(containerEl)
            .setName('Enable Time Management Module')
            .setDesc('Toggle the Time Management module features.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableTimeManagement)
                .onChange(async (value) => {
                    this.plugin.settings.enableTimeManagement = value;
                    // await this.plugin.saveSettings(); // Save is handled by a general save button or method
                    console.log('Time Management module toggled:', value);
                }));

        new Setting(containerEl)
            .setName('Enable Habits & Routines Module')
            .setDesc('Toggle the Habits & Routines module features.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableHabitsRoutines)
                .onChange(async (value) => {
                    this.plugin.settings.enableHabitsRoutines = value;
                    // await this.plugin.saveSettings();
                    console.log('Habits & Routines module toggled:', value);
                }));

        new Setting(containerEl)
            .setName('Enable Goal & Alignment Module')
            .setDesc('Toggle the Goal & Alignment module features.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableGoalAlignment)
                .onChange(async (value) => {
                    this.plugin.settings.enableGoalAlignment = value;
                    // await this.plugin.saveSettings();
                    console.log('Goal & Alignment module toggled:', value);
                }));
        
        new Setting(containerEl)
            .setName('Enable Journaling & Reflection Module')
            .setDesc('Toggle the Journaling & Reflection module features.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableJournaling)
                .onChange(async (value) => {
                    this.plugin.settings.enableJournaling = value;
                    // await this.plugin.saveSettings();
                    console.log('Journaling & Reflection module toggled:', value);
                }));

        // Security and API Key Management Section
        containerEl.createEl('h3', { text: 'Security & API Key Management' });

        new Setting(containerEl)
            .setName('Plugin Password')
            .setDesc('Set or change your plugin password. This password encrypts your API keys. It is NOT stored.')
            .addText(text => text
                .setPlaceholder('Enter new password (leave blank to keep unchanged)')
                .onChange(value => {
                    if (value) { // Only set if user actually types something
                        this.tempPassword = value;
                    } else {
                        this.tempPassword = undefined; // Clear if field is emptied
                    }
                }));
        
        const apiKeyFields: { key: keyof LifePlannerSettings; name: string; desc: string }[] = [
            { key: 'encryptedGptApiKey', name: 'OpenAI GPT API Key', desc: 'API Key for GPT-based AI features.' },
            { key: 'encryptedGoogleCalendarApiKey', name: 'Google Calendar API Key', desc: 'API Key for Google Calendar integration.' },
            { key: 'encryptedAppleCalendarApiKey', name: 'Apple Calendar API Key', desc: 'API Key for Apple Calendar integration.' },
            { key: 'encryptedGoogleFitApiKey', name: 'Google Fit API Key', desc: 'API Key for Google Fit integration.' },
            { key: 'encryptedAppleHealthApiKey', name: 'Apple Health API Key', desc: 'API Key for Apple Health data (if applicable via API).' },
            // Add other keys here as they are defined in LifePlannerSettings
        ];

        apiKeyFields.forEach(field => {
            new Setting(containerEl)
                .setName(field.name)
                .setDesc(field.desc)
                .addText(text => text
                    .setPlaceholder((this.plugin.settings as any)[field.key] ? 'API Key Set (Enter new to change)' : 'Enter API Key')
                    .setValue('') // Always clear on display, value is captured in onChange
                    .onChange(value => {
                        if (value.trim()) {
                            this.apiKeysToUpdate[field.key as string] = value.trim();
                        } else {
                            // If user clears the field, we might want to offer a way to remove the key
                            // For now, an empty submission means "no change" or "remove if supported"
                            // This logic is mainly handled in savePluginSettings
                        }
                    }));
        });

        // Save Button for all settings
        new Setting(containerEl)
            .addButton(button => button
                .setButtonText('Save All Settings')
                .setCta() // Makes it more prominent
                .onClick(async () => {
                    // Handle password and salt generation first
                    if (this.tempPassword) {
                        if (!this.plugin.settings.pluginPasswordSalt) {
                            this.plugin.settings.pluginPasswordSalt = await generateSalt();
                            new Notice('Plugin password salt generated. Save settings again to encrypt API keys with new password.');
                            // Do not proceed to encrypt with this save, user needs to know salt was just made
                        }
                         // tempPassword will be used in savePluginSettings
                    }
                    await this.savePluginSettings();
                    // Clear the temp password from memory after it's been used or discarded
                    this.tempPassword = undefined; 
                }));
    }
}
