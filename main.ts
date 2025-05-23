import { Plugin, Notice, TFile, normalizePath } from 'obsidian'; // Added Notice, TFile, normalizePath
import YearlyDashboard from './ui/YearlyDashboard.svelte'; // Optional test import
import { LifePlannerSettingTab, LifePlannerSettings, DEFAULT_SETTINGS } from './src/settings'; // Adjusted path
import { TimeBlockingView, TIME_BLOCKING_VIEW_TYPE } from './src/views/TimeBlockingView'; // Added
import { BacklogView, BACKLOG_VIEW_TYPE } from './src/views/BacklogView'; // Added
import { pomodoroTimer, logPomodoroSession, initPomodoroTracker, PomodoroSession } from './src/modules/time-management/PomodoroTracker'; // Added
import { setDisplayFocusUICallback, enterFocusMode, exitFocusMode, isFocusModeActive } from './src/modules/uihelpers/FocusModeManager'; // Added
import FocusModeDisplay from './src/ui/FocusModeDisplay.svelte'; // Added
import { getValuesFilePath, loadValues } from './src/modules/goal-alignment/ValuesManager'; // Added
// import { createGoal, CreateGoalParams, getGoalProgress } from './src/modules/goal-alignment/GoalManager'; // createGoal and CreateGoalParams are now used via the Modal
import { getGoalProgress, generateBurndownSnapshotString, buildGoalHierarchyText } from './src/modules/goal-alignment/GoalManager'; // Added getGoalProgress, generateBurndownSnapshotString, buildGoalHierarchyText
import { GoalCreationObsidianModal } from './src/modals/GoalCreationModal'; // Added
import { getSubscriptionFilePath, loadSubscriptions, getSubscriptionsNearingExpiry } from './src/modules/finance/SubscriptionManager'; // Added
import { findTaxRelevantItems, TaxRelevantItem, TaxRelevantAttachment } from './src/modules/finance/TaxPrepCollector'; // Added

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

    // Generate Tax Prep Report Command
    this.addCommand({
      id: 'generate-tax-prep-report',
      name: 'Generate Tax Prep Report',
      callback: async () => {
        try {
          const currentYear = new Date().getFullYear();
          const taxTag = prompt(`Enter the tax tag to search for (e.g., #tax/${currentYear}):`, `#tax/${currentYear}`);

          if (!taxTag || taxTag.trim() === '') {
            new Notice("Tax tag cannot be empty.");
            return;
          }

          const items = await findTaxRelevantItems(this.app, taxTag.trim());

          if (!items || items.length === 0) {
            new Notice(`No items found for tag: ${taxTag}`);
            return;
          }

          let reportContent = `# Tax Prep Report for Tag: ${taxTag}\n\n`;
          for (const item of items) {
            reportContent += `## [[${item.filePath}]]\n`;
            if (item.title) {
              reportContent += `- Title: ${item.title}\n`;
            }
            if (item.tags && item.tags.length > 0) {
              reportContent += `- Tags: ${item.tags.join(', ')}\n`;
            }
            if (item.attachments && item.attachments.length > 0) {
              reportContent += `- Attachments:\n`;
              for (const att of item.attachments) {
                if (att.resolvedFullPath) {
                  reportContent += `  - [[${att.resolvedFullPath}]] (${att.originalLink})\n`;
                } else {
                  reportContent += `  - ${att.fileName} (Original link: ${att.originalLink} - Could not resolve full path)\n`;
                }
              }
            }
            reportContent += "\n"; // Add a blank line between items
          }

          const reportDir = "finance/tax-prep";
          const normalizedReportDir = normalizePath(reportDir);
          if (!(await this.app.vault.adapter.exists(normalizedReportDir))) {
            await this.app.vault.createFolder(normalizedReportDir);
          }

          const sanitizedTag = taxTag.replace(/[^a-zA-Z0-9]/g, '-');
          const timestamp = new Date().toISOString().replace(/[^\d]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
          const reportFilePath = normalizePath(`${normalizedReportDir}/Tax Report - ${sanitizedTag} - ${timestamp}.md`);
          
          const reportFile = await this.app.vault.create(reportFilePath, reportContent);
          this.app.workspace.getLeaf(true).openFile(reportFile);
          new Notice(`Tax Prep Report generated: ${reportFilePath}`);

        } catch (error) {
          new Notice("Error generating tax prep report: " + error.message);
          console.error("Error generating tax prep report:", error);
        }
      }
    });

    // Manage Subscriptions Command
    this.addCommand({
      id: 'manage-subscriptions',
      name: 'Manage Subscriptions',
      callback: async () => {
        try {
          const filePath = getSubscriptionFilePath();
          // Calling loadSubscriptions ensures the file is created if it doesn't exist
          await loadSubscriptions(this.app); 
          
          const file = this.app.vault.getAbstractFileByPath(filePath);
          if (file instanceof TFile) {
            await this.app.workspace.getLeaf(true).openFile(file);
          } else {
            new Notice(`Could not open or create subscriptions file at ${filePath}.`);
            console.error(`Failed to open or create subscriptions file after load attempt: ${filePath}`);
          }
        } catch (error) {
          new Notice("Error managing subscriptions: " + error.message);
          console.error("Error in Manage Subscriptions command:", error);
        }
      }
    });

    // Check Upcoming Subscription Renewals Command
    this.addCommand({
      id: 'check-upcoming-subscription-renewals',
      name: 'Check Upcoming Subscription Renewals',
      callback: async () => {
        try {
          const daysAhead = 30; // Or make this a setting
          const subscriptions = await loadSubscriptions(this.app);

          if (!subscriptions || subscriptions.length === 0) {
            new Notice("No subscriptions found. Add some in 'finance/subscriptions.md'.");
            return;
          }

          const upcoming = getSubscriptionsNearingExpiry(subscriptions, daysAhead);

          if (upcoming.length === 0) {
            new Notice(`No subscriptions renewing in the next ${daysAhead} days.`);
            return;
          }

          let message = `Upcoming Renewals (${daysAhead} days):\n`;
          for (const sub of upcoming) {
            message += `- ${sub.serviceName} on ${sub.renewalDate} (${sub.amount})\n`;
          }
          new Notice(message, 15000); // Increased duration for potentially long list
        } catch (error) {
          new Notice("Error checking upcoming renewals: " + error.message);
          console.error("Error in Check Upcoming Subscription Renewals command:", error);
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

    // Define/Review Personal Values Command
    this.addCommand({
      id: 'define-review-personal-values',
      name: 'Define/Review Personal Values',
      callback: async () => {
          const filePath = getValuesFilePath();
          let file = this.app.vault.getAbstractFileByPath(filePath);

          // Ensure file exists, creating it via loadValues if necessary
          if (!(file instanceof TFile)) {
              // loadValues should create it if it's missing
              await loadValues(this.app); 
              file = this.app.vault.getAbstractFileByPath(filePath); // Try to get it again
              
              if (!(file instanceof TFile)) {
                  new Notice(`Error: Could not create or find the values file at ${filePath}.`);
                  console.error(`Failed to ensure existence of values file: ${filePath}`);
                  return;
              }
          }
          
          // Open the file
          const leaf = this.app.workspace.getLeaf(true); // Get a leaf, true for 'new leaf if needed'
          await leaf.openFile(file as TFile);
      }
    });

    // Create New Goal Command
    this.addCommand({
      id: 'create-new-goal',
      name: 'Create New Goal',
      callback: () => {
        new GoalCreationObsidianModal(this.app).open();
      }
    });

    // Show Current Goal Progress Command
    this.addCommand({
      id: 'show-current-goal-progress',
      name: 'Show Current Goal Progress',
      checkCallback: (checking: boolean) => {
          const activeFile = this.app.workspace.getActiveFile();

          if (!activeFile || !(activeFile instanceof TFile)) {
              return false;
          }

          const fm = this.app.metadataCache.getFileCache(activeFile)?.frontmatter;
          
          let isGoalNote = false;
          if (fm && fm.type) {
              if (typeof fm.type === 'string') {
                isGoalNote = fm.type === 'goal';
              } else if (Array.isArray(fm.type)) {
                isGoalNote = fm.type.includes('goal');
              }
          }

          if (!isGoalNote) {
              return false; // Not a goal note
          }

          if (!checking) {
              // Execute the command
              getGoalProgress(this.app, activeFile as TFile).then(progress => {
                  new Notice(`Goal '${activeFile.basename}': ${progress.completed}/${progress.total} tasks complete (${progress.percentage}%)`);
              }).catch(error => {
                  new Notice("Could not calculate goal progress. See console for details.");
                  console.error("Error calculating goal progress:", error);
              });
          }
          
          return true; // Command is available
      }
    });

    // Log Goal Progress Snapshot Command
    this.addCommand({
      id: 'log-goal-progress-snapshot',
      name: 'Log Goal Progress Snapshot',
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();

        if (!activeFile || !(activeFile instanceof TFile)) {
          return false;
        }

        const fm = this.app.metadataCache.getFileCache(activeFile)?.frontmatter;
        let isGoalNote = false;
        if (fm && fm.type) {
            if (typeof fm.type === 'string') {
                isGoalNote = fm.type === 'goal';
            } else if (Array.isArray(fm.type)) {
                isGoalNote = fm.type.includes('goal');
            }
        }

        if (!isGoalNote) {
          return false; // Not a goal note
        }

        if (!checking) {
          // Execute the command
          generateBurndownSnapshotString(this.app, activeFile as TFile).then(async (snapshotString) => {
            if (snapshotString.startsWith("Error generating")) {
              new Notice(snapshotString);
              return;
            }

            const currentContent = await this.app.vault.read(activeFile as TFile);
            const progressLogHeader = "\n## Progress Log"; // Ensure newline at start for separation
            const headerIndex = currentContent.lastIndexOf(progressLogHeader.trim()); // Use trim for matching

            let newContent: string;
            const newLogEntry = "\n- " + snapshotString;

            if (headerIndex === -1) { // Header not found
              newContent = currentContent + progressLogHeader + newLogEntry + "\n";
            } else { // Header found
              // Insert the new log entry immediately after the header line
              const beforeHeaderAndHeader = currentContent.substring(0, headerIndex + progressLogHeader.trim().length);
              const afterHeaderContent = currentContent.substring(headerIndex + progressLogHeader.trim().length);
              newContent = beforeHeaderAndHeader + newLogEntry + afterHeaderContent;
            }

            await this.app.vault.modify(activeFile as TFile, newContent);
            new Notice(`Progress snapshot logged to ${activeFile.basename}`);

          }).catch(error => {
            new Notice("Could not log goal progress. See console for details.");
            console.error("Error logging goal progress snapshot:", error);
          });
        }
        
        return true; // Command is available
      }
    });

    // Visualize Goal Hierarchy Command
    this.addCommand({
      id: 'visualize-goal-hierarchy',
      name: 'Visualize Goal Hierarchy',
      callback: async () => {
        try {
          const rootIdOrTitle = prompt("Enter Vision ID or Title to start hierarchy from (optional, leave blank for all top-level):");
          // User might cancel prompt, in which case rootIdOrTitle will be null.
          // buildGoalHierarchyText handles undefined or empty string for rootIdOrTitle.

          const hierarchyText = await buildGoalHierarchyText(this.app, rootIdOrTitle || undefined);

          // Check for short messages indicating no data
          if (hierarchyText.length < 100 && (hierarchyText.includes("No goals found") || hierarchyText.includes("No top-level") || hierarchyText.includes("Could not find"))) {
            new Notice(hierarchyText);
          } else {
            const sanitizedRootInfo = rootIdOrTitle ? rootIdOrTitle.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-') : 'All';
            const timestamp = new Date().toISOString().replace(/[^\d]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
            const fileName = `Goal Hierarchy - ${sanitizedRootInfo} - ${timestamp}.md`;
            
            const dashboardDir = "life-planner/dashboards"; // Defined earlier, ensure it exists
            const normalizedDashboardDir = normalizePath(dashboardDir);
            if (!(await this.app.vault.adapter.exists(normalizedDashboardDir))) {
                await this.app.vault.createFolder(normalizedDashboardDir);
            }
            
            const filePath = normalizePath(`${normalizedDashboardDir}/${fileName}`);

            const file = await this.app.vault.create(filePath, `# Goal Hierarchy: ${rootIdOrTitle || 'All Top-Level Goals'}\n\n${hierarchyText}`);
            this.app.workspace.getLeaf(true).openFile(file);
            new Notice(`Goal hierarchy view created: ${filePath}`);
          }
        } catch (error) {
          new Notice("Error generating goal hierarchy: " + error.message);
          console.error("Error generating goal hierarchy:", error);
        }
      }
    });


const BUDGET_TEMPLATE_MD = `
# Monthly Budget - {{YYYY-MM}}

## Summary

| Category          | Planned | Actual | Difference |
|-------------------|---------|--------|------------|
| Total Income      |         |        |            |
| Total Expenses    |         |        |            |
| **Net Balance**   |         |        |            |
| *Savings/Deficit* |         |        |            |

## Income

| Item          | Planned | Actual | Difference | Notes |
|---------------|---------|--------|------------|-------|
| Salary        | 3000    |        |            |       |
| Freelance Work| 500     |        |            |       |
| **Total Income**| **3500**|        |            |       |

## Fixed Expenses

| Item          | Planned | Actual | Difference | Notes |
|---------------|---------|--------|------------|-------|
| Rent/Mortgage | 1200    |        |            |       |
| Utilities     | 150     |        |            | (Water, Electricity, Gas) |
| Internet      | 60      |        |            |       |
| Phone Bill    | 50      |        |            |       |
| Subscriptions | 40      |        |            | (See finance/subscriptions.md) |
| **Total Fixed**| **1500**|        |            |       |

## Variable Expenses

| Item          | Planned | Actual | Difference | Notes |
|---------------|---------|--------|------------|-------|
| Groceries     | 400     |        |            |       |
| Dining Out    | 150     |        |            |       |
| Transportation| 100     |        |            | (Gas, Public Transport) |
| Entertainment | 100     |        |            |       |
| Personal Care | 50      |        |            |       |
| **Total Variable**| **800**|        |            |       |

## Financial Goals Contribution (Optional)

| Goal          | Planned Contribution | Actual Contribution | Notes |
|---------------|----------------------|---------------------|-------|
| Savings Fund  | 200                  |                     |       |
| Debt Repayment| 100                  |                     |       |
| **Total Goals**| **300**             |                     |       |

*(Note: All 'Actual' and 'Difference' columns, as well as 'Total' rows and the main 'Summary' table, are to be filled in manually by the user during this phase.)*
`;

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
      new Notice(\`Pomodoro '\${session.task_title || 'session'}' completed!\`);
      // Logging is handled by PomodoroWidget or could be called here if widget is not used/open
      // logPomodoroSession(session, undefined, this.app);
    } else {
      new Notice(\`Pomodoro '\${session.task_title || 'session'}' interrupted.\`);
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

    // Define/Review Personal Values Command
    this.addCommand({
      id: 'define-review-personal-values',
      name: 'Define/Review Personal Values',
      callback: async () => {
          const filePath = getValuesFilePath();
          let file = this.app.vault.getAbstractFileByPath(filePath);

          // Ensure file exists, creating it via loadValues if necessary
          if (!(file instanceof TFile)) {
              // loadValues should create it if it's missing
              await loadValues(this.app); 
              file = this.app.vault.getAbstractFileByPath(filePath); // Try to get it again
              
              if (!(file instanceof TFile)) {
                  new Notice(\`Error: Could not create or find the values file at \${filePath}.\`);
                  console.error(\`Failed to ensure existence of values file: \${filePath}\`);
                  return;
              }
          }
          
          // Open the file
          const leaf = this.app.workspace.getLeaf(true); // Get a leaf, true for 'new leaf if needed'
          await leaf.openFile(file as TFile);
      }
    });

    // Create New Goal Command
    this.addCommand({
      id: 'create-new-goal',
      name: 'Create New Goal',
      callback: () => {
        new GoalCreationObsidianModal(this.app).open();
      }
    });

    // Show Current Goal Progress Command
    this.addCommand({
      id: 'show-current-goal-progress',
      name: 'Show Current Goal Progress',
      checkCallback: (checking: boolean) => {
          const activeFile = this.app.workspace.getActiveFile();

          if (!activeFile || !(activeFile instanceof TFile)) {
              return false;
          }

          const fm = this.app.metadataCache.getFileCache(activeFile)?.frontmatter;
          
          let isGoalNote = false;
          if (fm && fm.type) {
              if (typeof fm.type === 'string') {
                isGoalNote = fm.type === 'goal';
              } else if (Array.isArray(fm.type)) {
                isGoalNote = fm.type.includes('goal');
              }
          }

          if (!isGoalNote) {
              return false; // Not a goal note
          }

          if (!checking) {
              // Execute the command
              getGoalProgress(this.app, activeFile as TFile).then(progress => {
                  new Notice(\`Goal '\${activeFile.basename}': \${progress.completed}/\${progress.total} tasks complete (\${progress.percentage}%)\`);
              }).catch(error => {
                  new Notice("Could not calculate goal progress. See console for details.");
                  console.error("Error calculating goal progress:", error);
              });
          }
          
          return true; // Command is available
      }
    });

    // Log Goal Progress Snapshot Command
    this.addCommand({
      id: 'log-goal-progress-snapshot',
      name: 'Log Goal Progress Snapshot',
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();

        if (!activeFile || !(activeFile instanceof TFile)) {
          return false;
        }

        const fm = this.app.metadataCache.getFileCache(activeFile)?.frontmatter;
        let isGoalNote = false;
        if (fm && fm.type) {
            if (typeof fm.type === 'string') {
                isGoalNote = fm.type === 'goal';
            } else if (Array.isArray(fm.type)) {
                isGoalNote = fm.type.includes('goal');
            }
        }

        if (!isGoalNote) {
          return false; // Not a goal note
        }

        if (!checking) {
          // Execute the command
          generateBurndownSnapshotString(this.app, activeFile as TFile).then(async (snapshotString) => {
            if (snapshotString.startsWith("Error generating")) {
              new Notice(snapshotString);
              return;
            }

            const currentContent = await this.app.vault.read(activeFile as TFile);
            const progressLogHeader = "\n## Progress Log"; // Ensure newline at start for separation
            const headerIndex = currentContent.lastIndexOf(progressLogHeader.trim()); // Use trim for matching

            let newContent: string;
            const newLogEntry = "\n- " + snapshotString;

            if (headerIndex === -1) { // Header not found
              newContent = currentContent + progressLogHeader + newLogEntry + "\n";
            } else { // Header found
              // Insert the new log entry immediately after the header line
              const beforeHeaderAndHeader = currentContent.substring(0, headerIndex + progressLogHeader.trim().length);
              const afterHeaderContent = currentContent.substring(headerIndex + progressLogHeader.trim().length);
              newContent = beforeHeaderAndHeader + newLogEntry + afterHeaderContent;
            }

            await this.app.vault.modify(activeFile as TFile, newContent);
            new Notice(\`Progress snapshot logged to \${activeFile.basename}\`);

          }).catch(error => {
            new Notice("Could not log goal progress. See console for details.");
            console.error("Error logging goal progress snapshot:", error);
          });
        }
        
        return true; // Command is available
      }
    });

    // Visualize Goal Hierarchy Command
    this.addCommand({
      id: 'visualize-goal-hierarchy',
      name: 'Visualize Goal Hierarchy',
      callback: async () => {
        try {
          const rootIdOrTitle = prompt("Enter Vision ID or Title to start hierarchy from (optional, leave blank for all top-level):");
          // User might cancel prompt, in which case rootIdOrTitle will be null.
          // buildGoalHierarchyText handles undefined or empty string for rootIdOrTitle.

          const hierarchyText = await buildGoalHierarchyText(this.app, rootIdOrTitle || undefined);

          // Check for short messages indicating no data
          if (hierarchyText.length < 100 && (hierarchyText.includes("No goals found") || hierarchyText.includes("No top-level") || hierarchyText.includes("Could not find"))) {
            new Notice(hierarchyText);
          } else {
            const sanitizedRootInfo = rootIdOrTitle ? rootIdOrTitle.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-') : 'All';
            const timestamp = new Date().toISOString().replace(/[^\d]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
            const fileName = \`Goal Hierarchy - \${sanitizedRootInfo} - \${timestamp}.md\`;
            
            const dashboardDir = "life-planner/dashboards"; // Defined earlier, ensure it exists
            const normalizedDashboardDir = normalizePath(dashboardDir);
            if (!(await this.app.vault.adapter.exists(normalizedDashboardDir))) {
                await this.app.vault.createFolder(normalizedDashboardDir);
            }
            
            const filePath = normalizePath(\`\${normalizedDashboardDir}/\${fileName}\`);

            const file = await this.app.vault.create(filePath, \`# Goal Hierarchy: \${rootIdOrTitle || 'All Top-Level Goals'}\n\n\${hierarchyText}\`);
            this.app.workspace.getLeaf(true).openFile(file);
            new Notice(\`Goal hierarchy view created: \${filePath}\`);
          }
        } catch (error) {
          new Notice("Error generating goal hierarchy: " + error.message);
          console.error("Error generating goal hierarchy:", error);
        }
      }
    });

    // Create New Monthly Budget Note Command
    this.addCommand({
      id: 'create-new-monthly-budget-note',
      name: 'Create New Monthly Budget Note',
      callback: async () => {
        const defaultYearMonth = new Date().toISOString().slice(0, 7);
        const yearMonth = prompt("Enter budget month (e.g., YYYY-MM):", defaultYearMonth);

        if (!yearMonth) { // User cancelled
          return;
        }
        if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
          new Notice("Invalid format. Please use YYYY-MM.");
          return;
        }

        const budgetDir = "finance/budget";
        const normalizedBudgetDir = normalizePath(budgetDir);
        const filePath = normalizePath(\`\${normalizedBudgetDir}/\${yearMonth} Budget.md\`);
        const templateWithDate = BUDGET_TEMPLATE_MD.replace("{{YYYY-MM}}", yearMonth);

        if (!(await this.app.vault.adapter.exists(normalizedBudgetDir))) {
          await this.app.vault.createFolder(normalizedBudgetDir);
        }

        const fileExists = await this.app.vault.adapter.exists(filePath);
        let fileToOpen: TFile | null = null;

        if (fileExists) {
          if (!confirm(\`Budget note for \${yearMonth} already exists. Open it?\`)) {
            return; // User chose not to open existing file
          }
          const abstractFile = this.app.vault.getAbstractFileByPath(filePath);
          if (abstractFile instanceof TFile) {
            fileToOpen = abstractFile;
          }
        } else {
          try {
            fileToOpen = await this.app.vault.create(filePath, templateWithDate);
            new Notice(\`Budget note for \${yearMonth} created.\`);
          } catch (error) {
            new Notice("Error creating budget note: " + error.message);
            console.error("Error creating budget note:", error);
            return;
          }
        }
        
        if (fileToOpen) {
          await this.app.workspace.getLeaf(true).openFile(fileToOpen);
        } else {
          new Notice("Error: Could not open or find the budget note.");
        }
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
