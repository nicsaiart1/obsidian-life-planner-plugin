// src/modules/projects-tasks/ui/ProjectsTasksObsidianView.ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import ProjectsTasksView from './ProjectsTasksView.svelte'; // Path to the Svelte component

export const VIEW_TYPE_PROJECTS_TASKS = 'projects-tasks-view';

export class ProjectsTasksObsidianView extends ItemView {
    component: ProjectsTasksView;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        // this.icon = 'check-square'; // Set icon for the view tab
    }

    getViewType() {
        return VIEW_TYPE_PROJECTS_TASKS;
    }

    getDisplayText() {
        return 'Projects & Tasks';
    }

    getIcon() {
        return 'check-square'; // Icon for the view tab header
    }

    async onOpen() {
        this.contentEl.empty(); // Ensure the content element is empty
        this.component = new ProjectsTasksView({
            target: this.contentEl,
            // props: {} // Any initial props if needed
        });
    }

    async onClose() {
        if (this.component) {
            this.component.$destroy();
        }
        this.contentEl.empty();
    }
}
