// src/views/TimeBlockingView.ts
import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import TimeBlockingCalendar from '../ui/TimeBlockingCalendar.svelte'; // Adjust path as needed

export const TIME_BLOCKING_VIEW_TYPE = "time-blocking-planner";

export class TimeBlockingView extends ItemView {
    private component: TimeBlockingCalendar | undefined;
    // Removed appInstance from constructor, will use this.app directly from ItemView

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        // app is available as this.app in ItemView
    }

    getViewType() {
        return TIME_BLOCKING_VIEW_TYPE;
    }

    getDisplayText() {
        return "Time Blocking Planner";
    }

    async onOpen() {
        this.contentEl.empty(); // Clear any previous content
        
        // Initialize the time blocking logic with the app instance
        // This is a conceptual call; the Svelte component itself might do this
        // or the functions in TimeBlockingPlanner might be refactored to take 'app' directly
        // For now, we assume initTimeBlocking is called somewhere or app is passed to functions.
        // import { initTimeBlocking } from '../modules/time-management/TimeBlockingPlanner';
        // initTimeBlocking(this.app); // Ensure this is called if your planner functions rely on it.

        this.component = new TimeBlockingCalendar({
            target: this.contentEl,
            props: {
                app: this.app  // Pass the app instance
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
