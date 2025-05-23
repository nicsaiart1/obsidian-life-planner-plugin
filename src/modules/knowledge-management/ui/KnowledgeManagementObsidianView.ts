// src/modules/knowledge-management/ui/KnowledgeManagementObsidianView.ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import KnowledgeManagementView from './KnowledgeManagementView.svelte'; // Path to the Svelte component

export const VIEW_TYPE_KNOWLEDGE_HUB = 'knowledge-hub-view';

export class KnowledgeManagementObsidianView extends ItemView {
    component: KnowledgeManagementView;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        // this.icon = 'brain'; // Set icon for the view tab
    }

    getViewType() {
        return VIEW_TYPE_KNOWLEDGE_HUB;
    }

    getDisplayText() {
        return 'Knowledge Hub';
    }

    getIcon() {
        return 'brain'; // Icon for the view tab header and switcher
    }

    async onOpen() {
        this.contentEl.empty(); // Ensure the content element is empty before mounting
        this.component = new KnowledgeManagementView({
            target: this.contentEl,
            // props: {} // Any initial props if needed for the Svelte component
        });
    }

    async onClose() {
        if (this.component) {
            this.component.$destroy();
        }
        this.contentEl.empty();
    }
}
