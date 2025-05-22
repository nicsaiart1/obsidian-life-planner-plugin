import { App, Modal } from 'obsidian';
import EisenhowerMatrix from './EisenhowerMatrix.svelte'; // Adjust path if needed

export class EisenhowerMatrixModal extends Modal {
    component: EisenhowerMatrix;

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        this.component = new EisenhowerMatrix({
            target: contentEl,
            props: {
                // Example props, adjust as needed
                urgentImportantTasks: [],
                notUrgentImportantTasks: []
            }
        });
    }

    onClose() {
        if (this.component) {
            this.component.$destroy();
        }
        this.contentEl.empty();
    }
}
