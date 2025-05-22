import { ItemView, WorkspaceLeaf } from 'obsidian';
import YearlyDashboard from './YearlyDashboard.svelte'; // Adjust path if needed

export const VIEW_TYPE_YEARLY_DASHBOARD = 'yearly-dashboard-view';

export class YearlyDashboardView extends ItemView {
    component: YearlyDashboard;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_YEARLY_DASHBOARD;
    }

    getDisplayText() {
        return 'Yearly Dashboard';
    }

    async onOpen() {
        this.component = new YearlyDashboard({
            target: this.contentEl,
        });
    }

    async onClose() {
        if (this.component) {
            this.component.$destroy();
        }
    }
}
