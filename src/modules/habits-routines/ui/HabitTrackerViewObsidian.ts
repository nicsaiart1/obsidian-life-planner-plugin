// src/modules/habits-routines/ui/HabitTrackerViewObsidian.ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import HabitTrackerView from './HabitTrackerView.svelte'; // Path to the Svelte component

export const VIEW_TYPE_HABIT_TRACKER = 'habit-tracker-view';

export class HabitTrackerViewObsidian extends ItemView {
    component: HabitTrackerView;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_HABIT_TRACKER;
    }

    getDisplayText() {
        return 'Habit Tracker';
    }

    async onOpen() {
        this.component = new HabitTrackerView({
            target: this.contentEl,
        });
    }

    async onClose() {
        if (this.component) {
            this.component.$destroy();
        }
        this.contentEl.empty();
    }
}
