// src/views/BacklogView.ts
import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import BacklogViewComponent from '../ui/BacklogViewComponent.svelte'; // Adjust path

export const BACKLOG_VIEW_TYPE = "backlog-view";

export class BacklogView extends ItemView {
    private component: BacklogViewComponent | undefined;

    // app is available as this.app in ItemView
    // constructor(leaf: WorkspaceLeaf) {
    //    super(leaf);
    // }

    getViewType() {
        return BACKLOG_VIEW_TYPE;
    }

    getDisplayText() {
        return "Backlog";
    }

    async onOpen() {
        this.contentEl.empty();
        this.component = new BacklogViewComponent({
            target: this.contentEl,
            props: {
                app: this.app // Pass the app instance
            }
        });
    }

    async onClose() {
        if (this.component) {
            this.component.$destroy();
            this.component = undefined;
        }
    }
}
