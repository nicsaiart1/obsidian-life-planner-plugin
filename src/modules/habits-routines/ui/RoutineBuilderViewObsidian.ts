// src/modules/habits-routines/ui/RoutineBuilderViewObsidian.ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import RoutineBuilderView from './RoutineBuilderView.svelte'; // Path to the Svelte component

export const VIEW_TYPE_ROUTINE_BUILDER = 'routine-builder-view';

export class RoutineBuilderViewObsidian extends ItemView {
    component: RoutineBuilderView;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_ROUTINE_BUILDER;
    }

    getDisplayText() {
        return 'Routine Builder';
    }

    async onOpen() {
        this.component = new RoutineBuilderView({
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
