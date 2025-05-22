import { ItemView, WorkspaceLeaf } from 'obsidian';
// import Timeline from './Timeline.svelte'; // Assuming you'll create this Svelte component later

export const VIEW_TYPE_TIMELINE = 'timeline-view';

export class TimelineView extends ItemView {
    // component: Timeline; // Uncomment when Timeline.svelte is created

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_TIMELINE;
    }

    getDisplayText() {
        return 'Timeline View';
    }

    async onOpen() {
        // Placeholder content until Timeline.svelte is ready
        this.contentEl.setText('Timeline View Placeholder');
        // When Timeline.svelte is ready, uncomment below and remove setText
        /*
        this.component = new Timeline({
            target: this.contentEl,
        });
        */
    }

    async onClose() {
        // if (this.component) {
        //     this.component.$destroy();
        // }
        this.contentEl.empty(); // Clear placeholder text
    }
}
