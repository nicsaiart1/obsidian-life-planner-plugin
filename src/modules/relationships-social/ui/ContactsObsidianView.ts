// src/modules/relationships-social/ui/ContactsObsidianView.ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import ContactsView from './ContactsView.svelte'; // Path to the Svelte component

export const VIEW_TYPE_CONTACTS_LOGBOOK = 'contacts-logbook-view';

export class ContactsObsidianView extends ItemView {
    component: ContactsView;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        // this.icon = 'users'; // Set icon for the view tab
    }

    getViewType() {
        return VIEW_TYPE_CONTACTS_LOGBOOK;
    }

    getDisplayText() {
        return 'Contacts Logbook';
    }

    getIcon() {
        return 'users'; // Icon for the view tab header and switcher
    }

    async onOpen() {
        this.contentEl.empty(); // Ensure the content element is empty before mounting
        this.component = new ContactsView({
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
