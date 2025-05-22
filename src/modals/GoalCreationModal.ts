// src/modals/GoalCreationModal.ts
import { App, Modal, TFile, Notice } from 'obsidian';
import CreateGoalSvelteComponent from '../ui/CreateGoalModal.svelte'; // Adjust path
import { createGoal, type CreateGoalParams } from '../modules/goal-alignment/GoalManager'; // Adjust path

export class GoalCreationObsidianModal extends Modal {
    private svelteComponent: CreateGoalSvelteComponent | undefined;

    constructor(app: App) {
        super(app);
    }

    async onOpen() {
        this.contentEl.empty();
        this.titleEl.setText("Create New Goal"); // Set modal title

        this.svelteComponent = new CreateGoalSvelteComponent({
            target: this.contentEl,
            props: {
                app: this.app,
                modalActions: {
                    close: () => {
                        this.close();
                    },
                    submit: async (params: CreateGoalParams) => {
                        try {
                            const newGoalPath = await createGoal(this.app, params);
                            if (newGoalPath) {
                                // Notice is already shown by createGoal on success.
                                // new Notice(\`Goal '\${params.title}' created!\`); 
                                const file = this.app.vault.getAbstractFileByPath(newGoalPath);
                                if (file instanceof TFile) {
                                    await this.app.workspace.getLeaf(true).openFile(file);
                                } else {
                                    new Notice(`Failed to open new goal file at: ${newGoalPath}`);
                                }
                                this.close();
                            } else {
                                // Error notice should be handled by createGoal if it explicitly shows one for null return,
                                // otherwise, a generic one might be needed here or rely on console.
                                // For this task, createGoal already shows a notice on error.
                            }
                        } catch (error) {
                            console.error("Error submitting goal creation modal:", error);
                            new Notice("An unexpected error occurred while creating the goal.");
                            // this.close(); // Optionally close on error too
                        }
                    }
                }
            }
        });
    }

    onClose() {
        if (this.svelteComponent) {
            this.svelteComponent.$destroy();
        }
        this.contentEl.empty();
    }
}
