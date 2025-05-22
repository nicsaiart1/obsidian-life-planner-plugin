// src/modules/journaling-reflection/ui/MoodLogObsidianView.ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import MoodLogView from './MoodLogView.svelte'; // Path to the Svelte component

export const VIEW_TYPE_MOOD_LOG = 'mood-log-view';

export class MoodLogObsidianView extends ItemView {
    component: MoodLogView;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        // this.icon = 'smile'; // Set icon for the view tab
    }

    getViewType() {
        return VIEW_TYPE_MOOD_LOG;
    }

    getDisplayText() {
        return 'Mood Log';
    }

    getIcon() {
        return 'smile'; // Icon for the view tab header
    }

    async onOpen() {
        this.contentEl.empty(); // Ensure the content element is empty
        this.component = new MoodLogView({
            target: this.contentEl,
            // props: {} // Any initial props if needed
        });

        this.component.$on('moodLogged', (event) => {
            // const newMoodLog = event.detail;
            // Potentially trigger other actions in Obsidian if needed
            // For example, refresh another view or display a notice
        });
    }

    async onClose() {
        if (this.component) {
            this.component.$destroy();
        }
        this.contentEl.empty();
    }
}
