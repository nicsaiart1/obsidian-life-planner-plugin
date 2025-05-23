import { Plugin } from 'obsidian';
import { LifePlannerSettingTab, LifePlannerSettings, DEFAULT_SETTINGS } from './src/settings'; // Adjusted path
import { YearlyDashboardView, VIEW_TYPE_YEARLY_DASHBOARD } from './src/ui/YearlyDashboardView';
import { EisenhowerMatrixModal } from './src/ui/EisenhowerMatrixModal';
import { TimelineView, VIEW_TYPE_TIMELINE } from './src/ui/TimelineView';
import { HabitTrackerViewObsidian, VIEW_TYPE_HABIT_TRACKER } from './src/modules/habits-routines/ui/HabitTrackerViewObsidian';
import { RoutineBuilderViewObsidian, VIEW_TYPE_ROUTINE_BUILDER } from './src/modules/habits-routines/ui/RoutineBuilderViewObsidian';
import { JournalEditorObsidianView, VIEW_TYPE_JOURNAL_EDITOR } from './src/modules/journaling-reflection/ui/JournalEditorObsidianView';
import { MoodLogObsidianView, VIEW_TYPE_MOOD_LOG } from './src/modules/journaling-reflection/ui/MoodLogObsidianView';
import { ProjectsTasksObsidianView, VIEW_TYPE_PROJECTS_TASKS } from './src/modules/projects-tasks/ui/ProjectsTasksObsidianView';
import { ContactsObsidianView, VIEW_TYPE_CONTACTS_LOGBOOK } from './src/modules/relationships-social/ui/ContactsObsidianView';
import { KnowledgeManagementObsidianView, VIEW_TYPE_KNOWLEDGE_HUB } from './src/modules/knowledge-management/ui/KnowledgeManagementObsidianView';

export default class LifePlannerPlugin extends Plugin {
  settings: LifePlannerSettings;

  async onload() {
    console.log('Loading Life Planner Plugin');
    await this.loadSettings();

    // Placeholder for future onload functionality

    this.addSettingTab(new LifePlannerSettingTab(this.app, this));

    // Register Views
    this.registerView(VIEW_TYPE_YEARLY_DASHBOARD, (leaf) => new YearlyDashboardView(leaf));
    this.registerView(VIEW_TYPE_TIMELINE, (leaf) => new TimelineView(leaf));
    this.registerView(
        VIEW_TYPE_HABIT_TRACKER,
        (leaf) => new HabitTrackerViewObsidian(leaf)
    );
    this.registerView(
        VIEW_TYPE_ROUTINE_BUILDER,
        (leaf) => new RoutineBuilderViewObsidian(leaf)
    );
    this.registerView(
        VIEW_TYPE_JOURNAL_EDITOR,
        (leaf) => new JournalEditorObsidianView(leaf)
    );
    this.registerView(
        VIEW_TYPE_MOOD_LOG,
        (leaf) => new MoodLogObsidianView(leaf)
    );
    this.registerView(
        VIEW_TYPE_PROJECTS_TASKS,
        (leaf) => new ProjectsTasksObsidianView(leaf)
    );
    this.registerView(
        VIEW_TYPE_CONTACTS_LOGBOOK,
        (leaf) => new ContactsObsidianView(leaf)
    );
    this.registerView(
        VIEW_TYPE_KNOWLEDGE_HUB,
        (leaf) => new KnowledgeManagementObsidianView(leaf)
    );

    // Add Commands
    this.addCommand({
        id: 'open-yearly-dashboard',
        name: 'Open Yearly Dashboard',
        callback: () => {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_YEARLY_DASHBOARD); // Close existing leaves first
            const leaf = this.app.workspace.getLeaf(true); // Get a new leaf
            leaf.setViewState({
                type: VIEW_TYPE_YEARLY_DASHBOARD,
                active: true,
            });
            this.app.workspace.revealLeaf(leaf); // Reveal the leaf
        },
    });

    this.addCommand({
        id: 'open-knowledge-hub',
        name: 'Knowledge Hub: Open',
        callback: () => {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_KNOWLEDGE_HUB);
            const leaf = this.app.workspace.getLeaf(true); // Get a new leaf or reuse an existing one
            leaf.setViewState({
                type: VIEW_TYPE_KNOWLEDGE_HUB,
                active: true,
            });
            this.app.workspace.revealLeaf(leaf); // Make sure the view is visible
        },
    });

    this.addCommand({
        id: 'open-contacts-logbook',
        name: 'Contacts: Open Logbook',
        callback: () => {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_CONTACTS_LOGBOOK);
            const leaf = this.app.workspace.getLeaf(true); // Get a new leaf or reuse an existing one
            leaf.setViewState({
                type: VIEW_TYPE_CONTACTS_LOGBOOK,
                active: true,
            });
            this.app.workspace.revealLeaf(leaf); // Make sure the view is visible
        },
    });

    this.addCommand({
        id: 'open-projects-tasks-view',
        name: 'Projects & Tasks: Open View',
        callback: () => {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_PROJECTS_TASKS);
            const leaf = this.app.workspace.getLeaf(true);
            leaf.setViewState({
                type: VIEW_TYPE_PROJECTS_TASKS,
                active: true,
            });
            this.app.workspace.revealLeaf(leaf);
        },
    });

    this.addCommand({
        id: 'open-mood-log',
        name: 'Mood: Log & View',
        callback: () => {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_MOOD_LOG);
            const leaf = this.app.workspace.getLeaf(true);
            leaf.setViewState({
                type: VIEW_TYPE_MOOD_LOG,
                active: true,
            });
            this.app.workspace.revealLeaf(leaf);
        },
    });

    this.addCommand({
        id: 'open-journal-editor',
        name: 'Journal: Open Editor',
        callback: () => {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_JOURNAL_EDITOR);
            const leaf = this.app.workspace.getLeaf(true);
            leaf.setViewState({
                type: VIEW_TYPE_JOURNAL_EDITOR,
                active: true,
            });
            this.app.workspace.revealLeaf(leaf);
        },
    });

    this.addCommand({
        id: 'open-routine-builder',
        name: 'Routine Builder: Open',
        callback: () => {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_ROUTINE_BUILDER);
            const leaf = this.app.workspace.getLeaf(true);
            leaf.setViewState({
                type: VIEW_TYPE_ROUTINE_BUILDER,
                active: true,
            });
            this.app.workspace.revealLeaf(leaf);
        },
    });

    this.addCommand({
        id: 'open-habit-tracker',
        name: 'Habit Tracker: Open',
        callback: () => {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_HABIT_TRACKER); // Close existing leaves first
            const leaf = this.app.workspace.getLeaf(true); // Get a new leaf
            leaf.setViewState({
                type: VIEW_TYPE_HABIT_TRACKER,
                active: true,
            });
            this.app.workspace.revealLeaf(leaf); // Reveal the leaf
        },
    });

    this.addCommand({
        id: 'open-eisenhower-matrix',
        name: 'Open Eisenhower Matrix',
        callback: () => {
            new EisenhowerMatrixModal(this.app).open();
        },
    });

    this.addCommand({
        id: 'open-timeline-view',
        name: 'Open Timeline View',
        callback: () => {
            this.app.workspace.detachLeavesOfType(VIEW_TYPE_TIMELINE); // Close existing leaves first
            const leaf = this.app.workspace.getLeaf(true); // Get a new leaf
            leaf.setViewState({
                type: VIEW_TYPE_TIMELINE,
                active: true,
            });
            this.app.workspace.revealLeaf(leaf); // Reveal the leaf
        },
    });

    // Add Ribbon Icons
    this.addRibbonIcon('calendar-days', 'Open Yearly Dashboard', () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_YEARLY_DASHBOARD); // Close existing leaves first
        const leaf = this.app.workspace.getLeaf(true); // Get a new leaf
        leaf.setViewState({
            type: VIEW_TYPE_YEARLY_DASHBOARD,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf); // Reveal the leaf
    });

    this.addRibbonIcon('gantt-chart', 'Open Timeline View', () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_TIMELINE); // Close existing leaves first
        const leaf = this.app.workspace.getLeaf(true); // Get a new leaf
        leaf.setViewState({
            type: VIEW_TYPE_TIMELINE,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf); // Reveal the leaf
    });

    this.addRibbonIcon('target', 'Open Habit Tracker', () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_HABIT_TRACKER);
        const leaf = this.app.workspace.getLeaf(true);
        leaf.setViewState({
            type: VIEW_TYPE_HABIT_TRACKER,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf);
    });

    this.addRibbonIcon('brain', 'Open Knowledge Hub', () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_KNOWLEDGE_HUB);
        const leaf = this.app.workspace.getLeaf(true);
        leaf.setViewState({
            type: VIEW_TYPE_KNOWLEDGE_HUB,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf);
    });

    this.addRibbonIcon('users', 'Open Contacts Logbook', () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CONTACTS_LOGBOOK);
        const leaf = this.app.workspace.getLeaf(true);
        leaf.setViewState({
            type: VIEW_TYPE_CONTACTS_LOGBOOK,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf);
    });

    this.addRibbonIcon('check-square', 'Open Projects & Tasks', () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_PROJECTS_TASKS);
        const leaf = this.app.workspace.getLeaf(true);
        leaf.setViewState({
            type: VIEW_TYPE_PROJECTS_TASKS,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf);
    });

    this.addRibbonIcon('smile', 'Open Mood Log', () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_MOOD_LOG);
        const leaf = this.app.workspace.getLeaf(true);
        leaf.setViewState({
            type: VIEW_TYPE_MOOD_LOG,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf);
    });

    this.addRibbonIcon('notebook-pen', 'Open Journal Editor', () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_JOURNAL_EDITOR);
        const leaf = this.app.workspace.getLeaf(true);
        leaf.setViewState({
            type: VIEW_TYPE_JOURNAL_EDITOR,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf);
    });

    this.addRibbonIcon('list-checks', 'Open Routine Builder', () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_ROUTINE_BUILDER);
        const leaf = this.app.workspace.getLeaf(true);
        leaf.setViewState({
            type: VIEW_TYPE_ROUTINE_BUILDER,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf);
    });

    // Example of using a placeholder
    await generateDailyNotePlaceholder(new Date());
    await connectGoogleCalendarPlaceholder();
  }

  onunload() {
    console.log('Unloading Life Planner Plugin');
    // Placeholder for future onunload functionality
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// 1. Template Generation Placeholders
async function generateDailyNotePlaceholder(date: Date): Promise<void> {
  console.log(`Generating daily note for ${date}`);
}
async function generateWeeklyNotePlaceholder(date: Date): Promise<void> {
  console.log(`Generating weekly note for ${date}`);
}
async function generateMonthlyNotePlaceholder(date: Date): Promise<void> {
  console.log(`Generating monthly note for ${date}`);
}
async function generateYearlyNotePlaceholder(date: Date): Promise<void> {
  console.log(`Generating yearly note for ${date}`);
}

// 3. Nested Goal Hierarchy Data Structures
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'inprogress' | 'done';
}
interface Milestone {
  id: string;
  title: string;
  tasks: Task[];
  status: 'open' | 'closed';
}
interface Goal {
  id: string;
  title: string;
  visionId: string;
  milestones: Milestone[];
}
interface Vision {
  id: string;
  title: string;
  description: string;
}

// 5. Calendar Sync Stubs
async function connectGoogleCalendarPlaceholder(): Promise<void> {
  console.log('Placeholder: Connect to Google Calendar');
}
async function connectAppleCalendarPlaceholder(): Promise<void> {
  console.log('Placeholder: Connect to Apple Calendar');
}
async function syncEventsPlaceholder(): Promise<void> {
  console.log('Placeholder: Sync calendar events');
}
