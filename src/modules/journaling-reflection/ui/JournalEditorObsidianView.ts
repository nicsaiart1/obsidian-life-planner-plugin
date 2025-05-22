// src/modules/journaling-reflection/ui/JournalEditorObsidianView.ts
import { ItemView, WorkspaceLeaf, ViewStateResult, MarkdownView } from 'obsidian';
import JournalEditorView from './JournalEditorView.svelte'; // Path to the Svelte component

export const VIEW_TYPE_JOURNAL_EDITOR = 'journal-editor-view';

export class JournalEditorObsidianView extends ItemView {
    component: JournalEditorView;
    // Add a unique identifier for the view's state, if needed for more complex state management
    // private currentEntryId: string | null = null; 

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        // Potentially set an icon for the view tab
        // this.icon = 'notebook-pen'; 
    }

    getViewType() {
        return VIEW_TYPE_JOURNAL_EDITOR;
    }

    getDisplayText() {
        // Display text could be dynamic, e.g., based on the entry being edited
        return 'Journal Editor';
    }
    
    // Optional: If you want the icon in the tab header
    getIcon() {
        return 'notebook-pen';
    }

    // Optional: To handle specific view states if you want to open specific entries
    // async setState(state: any, result: ViewStateResult): Promise<void> {
    //     this.currentEntryId = state.journalEntryId || null;
    //     await super.setState(state, result);
    //     // Potentially re-initialize or update the Svelte component if it's already mounted
    //     if (this.component) {
    //         this.component.$set({ journalEntryId: this.currentEntryId });
    //     }
    //     return Promise.resolve();
    // }

    // getState(): any {
    //     const state = super.getState();
    //     state.journalEntryId = this.currentEntryId;
    //     return state;
    // }


    async onOpen() {
        this.contentEl.empty(); // Ensure the content element is empty before mounting
        this.component = new JournalEditorView({
            target: this.contentEl,
            props: {
                // journalEntryId: this.currentEntryId // Pass ID if managing state like above
            }
        });

        // Listen for custom event from Svelte component if needed
        this.component.$on('entrySaved', (event) => {
            // const savedEntry = event.detail;
            // Potentially update display text or trigger other Obsidian actions
            // this.leaf.setDisplayText(`Journal: ${savedEntry.title || 'Untitled'}`);
            
            // If you want to open the actual note in Obsidian after saving:
            // This is more advanced and assumes journal entries correspond to notes.
            // For now, we'll keep it simple.
        });
    }

    async onClose() {
        if (this.component) {
            this.component.$destroy();
        }
        this.contentEl.empty();
    }
}
