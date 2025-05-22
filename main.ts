import { Plugin, Notice } from 'obsidian'; // Added Notice
import YearlyDashboard from './ui/YearlyDashboard.svelte'; // Optional test import
import { LifePlannerSettingTab, LifePlannerSettings, DEFAULT_SETTINGS } from './src/settings'; // Adjusted path
import { TimeBlockingView, TIME_BLOCKING_VIEW_TYPE } from './src/views/TimeBlockingView'; // Added
import { BacklogView, BACKLOG_VIEW_TYPE } from './src/views/BacklogView'; // Added
import { pomodoroTimer, logPomodoroSession, initPomodoroTracker, PomodoroSession } from './src/modules/time-management/PomodoroTracker'; // Added
import { setDisplayFocusUICallback, enterFocusMode, exitFocusMode, isFocusModeActive } from './src/modules/uihelpers/FocusModeManager'; // Added
import FocusModeDisplay from './src/ui/FocusModeDisplay.svelte'; // Added

// FullCalendar CSS Imports
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
// import '@fullcalendar/common/main.css'; // Usually not needed if core is imported, but check FullCalendar docs for specific version

// Focus Mode CSS Import
import './focus-mode.css'; // Added

export default class LifePlannerPlugin extends Plugin {
  settings: LifePlannerSettings;
  private statusBarItemEl: HTMLElement | undefined; // Added for Pomodoro status bar
  private focusModeComponent: FocusModeDisplay | null = null; // Added
  private focusModeHostDiv: HTMLElement | null = null; // Added

  // Define listener functions so they can be added and removed
  private pomodoroTickListener = (time: number) => {
    this.updatePomodoroStatusBar();
  };
  private pomodoroEndListener = (session: PomodoroSession) => {
    this.updatePomodoroStatusBar();
    if (session.status === 'completed') {
      new Notice(`Pomodoro '${session.task_title || 'session'}' completed!`);
      // Logging is handled by PomodoroWidget or could be called here if widget is not used/open
      // logPomodoroSession(session, undefined, this.app);
    } else {
      new Notice(`Pomodoro '${session.task_title || 'session'}' interrupted.`);
    }
  };

  // Escape Key Handler for Focus Mode
  private escapeKeyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isFocusModeActive()) {
        exitFocusMode(); // This will trigger the UI callback to hide
    }
  };


  async onload() {
    console.log('Loading Life Planner Plugin');
    await this.loadSettings();

    // Initialize Pomodoro Tracker with app context
    initPomodoroTracker(this.app);

    // Initialize Focus Mode Host Div
    this.focusModeHostDiv = document.createElement('div');
    // Optionally add a class or ID for easier identification in the DOM
    // this.focusModeHostDiv.id = 'life-planner-focus-mode-host';

    // Set up Focus Mode UI Callback
    setDisplayFocusUICallback((show, title, details) => {
      if (show) {
        if (!this.focusModeComponent && this.focusModeHostDiv) { // Mount only if not already mounted
          document.body.appendChild(this.focusModeHostDiv);
          this.focusModeComponent = new FocusModeDisplay({
            target: this.focusModeHostDiv,
            props: {
              taskTitle: title,
              taskDetails: details,
            }
          });
          document.addEventListener('keydown', this.escapeKeyHandler);
        } else if (this.focusModeComponent) { // If already mounted, just update props
          this.focusModeComponent.$set({ taskTitle: title, taskDetails: details });
        }
      } else {
        if (this.focusModeComponent) {
          this.focusModeComponent.$destroy();
          this.focusModeComponent = null;
          if (this.focusModeHostDiv && this.focusModeHostDiv.parentNode) {
            this.focusModeHostDiv.remove();
          }
          document.removeEventListener('keydown', this.escapeKeyHandler);
        }
      }
    });


    this.addSettingTab(new LifePlannerSettingTab(this.app, this));

    // Register Views
    this.registerView(TIME_BLOCKING_VIEW_TYPE, (leaf) => new TimeBlockingView(leaf));
    this.registerView(BACKLOG_VIEW_TYPE, (leaf) => new BacklogView(leaf)); // Added

    // Add Ribbon Icons
    this.addRibbonIcon('calendar-days', 'Open Time Blocking Planner', () => {
      this.activateView(TIME_BLOCKING_VIEW_TYPE);
    });
    this.addRibbonIcon('list-checks', 'Open Backlog View', () => { // Added
      this.activateView(BACKLOG_VIEW_TYPE);
    });

    // Add Commands
    this.addCommand({
      id: 'open-time-blocking-planner',
      name: 'Open Time Blocking Planner',
      callback: () => {
        this.activateView(TIME_BLOCKING_VIEW_TYPE);
      }
    });
    this.addCommand({ // Added
      id: 'open-backlog-view',
      name: 'Open Backlog View',
      callback: () => {
        this.activateView(BACKLOG_VIEW_TYPE);
      }
    });

    // Enter Focus Mode Command
    this.addCommand({
      id: 'enter-focus-mode',
      name: 'Enter Focus Mode',
      callback: () => {
        const title = prompt("Enter focus task title:");
        if (title === null) return; // User cancelled
        
        const details = prompt("Enter task details (optional):");
        // If details prompt is cancelled, details will be null, which is fine for enterFocusMode
        
        enterFocusMode(title || "Focus", details || undefined);
      }
    });

    // Pomodoro Commands
    this.addCommand({
      id: 'start-pomodoro',
      name: 'Start Pomodoro',
      callback: () => {
        // Simple prompt for now. Could be replaced with a modal.
        const taskTitle = prompt("Enter task title (optional):");
        const duration = this.settings.pomodoroDuration || 25; // Assuming a setting for duration
        if (taskTitle === null) return; // User cancelled prompt
        pomodoroTimer.start(duration, taskTitle || undefined); // Handle empty string as undefined
        this.updatePomodoroStatusBar(); // Update status bar immediately
      }
    });
    this.addCommand({
      id: 'pause-pomodoro',
      name: 'Pause Pomodoro',
      callback: () => {
        if (pomodoroTimer.getIsRunning()) {
          pomodoroTimer.pause();
          this.updatePomodoroStatusBar();
        } else {
          new Notice("Pomodoro is not running.");
        }
      }
    });
    this.addCommand({
      id: 'resume-pomodoro',
      name: 'Resume Pomodoro',
      callback: () => {
        if (!pomodoroTimer.getIsRunning() && pomodoroTimer.getRemainingTime() > 0) {
          pomodoroTimer.resume();
          this.updatePomodoroStatusBar();
        } else {
          new Notice("No Pomodoro to resume or already running.");
        }
      }
    });
    this.addCommand({
      id: 'stop-pomodoro',
      name: 'Stop Pomodoro',
      callback: () => {
        if (pomodoroTimer.getRemainingTime() > 0) { // Check if there's anything to stop
          pomodoroTimer.stop(true); // true for interrupted
          // Status bar will be updated by the end listener
        } else {
          new Notice("No Pomodoro session is active.");
        }
      }
    });

    // Pomodoro Status Bar
    this.statusBarItemEl = this.addStatusBarItem();
    this.updatePomodoroStatusBar(); // Initial update
    pomodoroTimer.addTickListener(this.pomodoroTickListener);
    pomodoroTimer.addEndListener(this.pomodoroEndListener);

    // Set Task Energy Level Command
    this.addCommand({
      id: 'set-task-energy-level',
      name: 'Set Task Energy Level',
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          return false;
        }

        const fileCache = this.app.metadataCache.getFileCache(activeFile);
        const fm = fileCache?.frontmatter;

        // Task identification: check if type is 'task' or an array containing 'task'
        // This could be expanded to use a list of task types like in TaskQueryEngine
        let isTask = false;
        if (fm && fm.type) {
            if (typeof fm.type === 'string') {
                isTask = fm.type === 'task';
            } else if (Array.isArray(fm.type)) {
                isTask = fm.type.includes('task');
            }
        }
        
        if (!isTask) {
          return false;
        }

        if (!checking) { // If check passed and we are actually executing
          const levels = ["low", "medium", "high", "clear"];
          const choice = prompt(`Set energy level for '${activeFile.basename}':\n(low, medium, high, or clear)`);

          if (choice === null) { // User cancelled prompt
            return;
          }

          const selectedLevel = choice.trim().toLowerCase();

          if (!levels.includes(selectedLevel) && selectedLevel !== "") { // Validate input
            new Notice(`Invalid energy level: '${choice}'. Please use low, medium, high, or clear.`);
            return;
          }

          this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
            if (selectedLevel === "clear" || selectedLevel === "") {
              delete frontmatter.energy_level;
              new Notice(`Energy level cleared for ${activeFile.basename}`);
            } else {
              frontmatter.energy_level = selectedLevel;
              new Notice(`Energy level set to '${selectedLevel}' for ${activeFile.basename}`);
            }
          }).catch(err => {
            new Notice("Error updating energy level: " + err.message);
            console.error("Error setting energy level:", err);
          });
        }
        return true; // Command is valid for this context
      }
    });


    // Optional: Log the imported Svelte component to test build
    console.log('YearlyDashboard component:', YearlyDashboard);

    // Example of using a placeholder
    await generateDailyNotePlaceholder(new Date());
    const yearlyDashboardView = new YearlyDashboardView(); // Renamed to avoid conflict
    yearlyDashboardView.render();
    const eisenhowerModal = new EisenhowerMatrixModal();
    eisenhowerModal.open();
    await connectGoogleCalendarPlaceholder();
    const timelineView = new TimelineView();
    timelineView.render();
  }

  onunload() {
    console.log('Unloading Life Planner Plugin');
    // Remove Pomodoro listeners
    if (this.pomodoroTickListener) pomodoroTimer.removeTickListener(this.pomodoroTickListener);
    if (this.pomodoroEndListener) pomodoroTimer.removeEndListener(this.pomodoroEndListener);

    // Clean up Focus Mode UI and listeners
    if (this.focusModeComponent) {
        this.focusModeComponent.$destroy();
        this.focusModeComponent = null;
    }
    if (this.focusModeHostDiv && this.focusModeHostDiv.parentNode) {
        this.focusModeHostDiv.remove();
    }
    document.removeEventListener('keydown', this.escapeKeyHandler); // Ensure escape listener is removed
  }

  private updatePomodoroStatusBar() {
    if (!this.statusBarItemEl) return;
    const remaining = pomodoroTimer.getRemainingTime();
    const isRunning = pomodoroTimer.getIsRunning();
    if (remaining > 0) {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        this.statusBarItemEl.setText(`🍅 ${isRunning ? '▶' : '⏸'} ${timeStr}`);
    } else {
        this.statusBarItemEl.setText('🍅 Ready');
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Add pomodoroDuration to settings if it's not there
    if (this.settings.pomodoroDuration === undefined) {
        this.settings.pomodoroDuration = 25; // Default duration
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView(viewType: string) {
    // Check if a leaf of this type already exists
    const existingLeaves = this.app.workspace.getLeavesOfType(viewType);
    if (existingLeaves.length > 0) {
        this.app.workspace.revealLeaf(existingLeaves[0]);
        return;
    }

    // If not, create a new leaf in the main workspace
    const leaf = this.app.workspace.getLeaf('tab'); // 'tab', 'split', 'window'
    await leaf.setViewState({
        type: viewType,
        active: true,
    });
    this.app.workspace.revealLeaf(leaf);
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

// 2. Yearly Dashboard Structure
export class YearlyDashboardView {
  constructor() {
    console.log('YearlyDashboardView initialized');
  }
  render() {
    console.log('Render Yearly Dashboard');
    /* Later, this will interact with Obsidian's view system */
  }
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

// 4. Eisenhower Matrix View
export class EisenhowerMatrixModal {
  constructor() {
    console.log('EisenhowerMatrixModal initialized');
  }
  open() {
    console.log('Open Eisenhower Matrix Modal');
    /* Later, this will use Obsidian's Modal class */
  }
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

// 6. Timeline View Stub
export class TimelineView {
  constructor() {
    console.log('TimelineView initialized');
  }
  render() {
    console.log('Render Timeline View');
    /* Later, this will use D3.js and Obsidian's view system */
  }
}
