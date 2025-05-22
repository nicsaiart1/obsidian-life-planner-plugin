import { Plugin } from 'obsidian';
import YearlyDashboard from './ui/YearlyDashboard.svelte'; // Optional test import
import { LifePlannerSettingTab, LifePlannerSettings, DEFAULT_SETTINGS } from './src/settings'; // Adjusted path

export default class LifePlannerPlugin extends Plugin {
  settings: LifePlannerSettings;

  async onload() {
    console.log('Loading Life Planner Plugin');
    await this.loadSettings();

    // Placeholder for future onload functionality

    // Optional: Log the imported Svelte component to test build
    console.log('YearlyDashboard component:', YearlyDashboard);

    this.addSettingTab(new LifePlannerSettingTab(this.app, this));

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
