// src/settings.ts
import { App, PluginSettingTab, Setting } from 'obsidian';
import LifePlannerPlugin from '../main'; // Adjust path if main.ts is elsewhere

export interface LifePlannerSettings {
    enableTimeManagement: boolean;
    enableHabitsRoutines: boolean;
    enableGoalAlignment: boolean;
    // Add more settings as modules are developed
    // Example:
    // dailyNoteTemplatePath: string;
    enableJournaling: boolean; // Added for the placeholder
}

export const DEFAULT_SETTINGS: LifePlannerSettings = {
    enableTimeManagement: true,
    enableHabitsRoutines: true,
    enableGoalAlignment: true,
    // dailyNoteTemplatePath: "templates/daily-note.md",
    enableJournaling: true, // Added for the placeholder
};

export class LifePlannerSettingTab extends PluginSettingTab {
    plugin: LifePlannerPlugin;

    constructor(app: App, plugin: LifePlannerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Life Planner Settings' });

        new Setting(containerEl)
            .setName('Enable Time Management Module')
            .setDesc('Toggle the Time Management module features.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableTimeManagement)
                .onChange(async (value) => {
                    this.plugin.settings.enableTimeManagement = value;
                    await this.plugin.saveSettings();
                    // Add logic here to actually enable/disable module features if needed
                    console.log('Time Management module toggled:', value);
                }));

        new Setting(containerEl)
            .setName('Enable Habits & Routines Module')
            .setDesc('Toggle the Habits & Routines module features.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableHabitsRoutines)
                .onChange(async (value) => {
                    this.plugin.settings.enableHabitsRoutines = value;
                    await this.plugin.saveSettings();
                    console.log('Habits & Routines module toggled:', value);
                }));

        new Setting(containerEl)
            .setName('Enable Goal & Alignment Module')
            .setDesc('Toggle the Goal & Alignment module features.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableGoalAlignment)
                .onChange(async (value) => {
                    this.plugin.settings.enableGoalAlignment = value;
                    await this.plugin.saveSettings();
                    console.log('Goal & Alignment module toggled:', value);
                }));
        
        // Add more placeholder toggles for other modules as a pattern:
        // Journaling & Reflection, Projects & Tasks, Financial Life, etc.
        // For example:
        new Setting(containerEl)
            .setName('Enable Journaling & Reflection Module (Placeholder)')
            .setDesc('Toggle the Journaling & Reflection module features.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableJournaling) // Would need to add to LifePlannerSettings
                // .setValue(true) // Placeholder value
                .onChange(async (value) => {
                    this.plugin.settings.enableJournaling = value;
                    await this.plugin.saveSettings();
                    console.log('Journaling & Reflection module toggled (placeholder):', value);
                }));
    }
}
