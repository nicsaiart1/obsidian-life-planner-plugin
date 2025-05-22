// src/modules/time-management/PomodoroTracker.ts
import { App, TFile, FrontMatterCache } from 'obsidian'; // For actual Obsidian API interaction
import * as yaml from 'js-yaml'; // For conceptual file manipulation

export interface PomodoroSession {
    id: string;
    startTime: string; // ISO 8601 string
    duration: number;  // minutes
    task_title?: string;
    projectId?: string;
    status: 'completed' | 'interrupted';
}

// --- Conceptual App Instance & Initialization (similar to TimeBlockingPlanner) ---
let _app: App;
export function initPomodoroTracker(obsidianApp: App) {
    _app = obsidianApp;
    console.log("PomodoroTracker initialized with Obsidian App instance.");
}

// --- Helper Functions (Conceptual for direct file access, prefer Obsidian API) ---
// These are similar to those in TimeBlockingPlanner.ts, adapted for Pomodoro.

function getDailyNotePath(date: string): string {
    return `daily/${date}.md`; // Assumes 'daily/YYYY-MM-DD.md' structure
}

async function _conceptualReadDailyNoteContent(date: string): Promise<string | null> {
    const dailyNotePath = getDailyNotePath(date);
    if (_app && _app.vault && _app.vault.adapter) {
         const fileExists = await _app.vault.adapter.exists(dailyNotePath);
         if (fileExists) {
            return await _app.vault.adapter.read(dailyNotePath);
         }
         console.warn(`[Conceptual Read - Pomodoro] Daily note ${dailyNotePath} not found.`);
         return null;
    }
    console.log(`[Conceptual Read - Pomodoro] _app.vault.adapter not available. Simulating read for ${dailyNotePath}.`);
    // Fallback simulation
    return `---
date: ${date}
type: daily-note
pomodoro_sessions: []
---
# Daily Content for ${date}
`;
}

async function _conceptualWriteDailyNoteContent(date: string, newContent: string): Promise<void> {
    const dailyNotePath = getDailyNotePath(date);
    if (_app && _app.vault && _app.vault.adapter) {
        await _app.vault.adapter.write(dailyNotePath, newContent);
        console.log(`[Conceptual Write - Pomodoro] Successfully wrote to ${dailyNotePath} (using _app.vault.adapter)`);
        return;
    }
    console.log(`[Conceptual Write - Pomodoro] _app.vault.adapter not available. Simulating write for ${dailyNotePath}.`);
}

function parseMarkdownWithFrontmatter(markdown: string): { frontmatter: any, content: string } {
    const fmMatch = markdown.match(/^---\s*([\s\S]*?)\s*---/);
    if (fmMatch && fmMatch[1]) {
        try {
            const frontmatter = yaml.load(fmMatch[1]);
            const content = markdown.substring(fmMatch[0].length).trimStart();
            return { frontmatter, content };
        } catch (e) {
            console.error("Error parsing YAML frontmatter (Pomodoro):", e);
            return { frontmatter: {}, content: markdown };
        }
    }
    return { frontmatter: {}, content: markdown };
}

function stringifyMarkdownWithFrontmatter(frontmatter: any, content: string): string {
    const cleanFrontmatter = JSON.parse(JSON.stringify(frontmatter)); // Avoid issues with undefined
    const fmString = yaml.dump(cleanFrontmatter, { skipInvalid: true, indent: 2 });
    return `---
${fmString}---
${content}`;
}

// --- Pomodoro Timer Logic ---
class PomodoroTimer {
    private isRunning: boolean = false;
    private remainingTime: number = 0; // seconds
    private currentSessionDuration: number = 0; // minutes for the current running session
    private timerId: any = null; // Store setInterval ID
    
    private sessionStartTime: string | null = null;
    private currentTaskTitle?: string;
    private currentProjectId?: string;

    // Callbacks - Changed to arrays for multiple listeners
    private tickListeners: Array<(time: number) => void> = [];
    private endListeners: Array<(session: PomodoroSession) => void> = [];

    // Methods to manage listeners
    public addTickListener(listener: (time: number) => void) {
        this.tickListeners.push(listener);
    }
    public removeTickListener(listener: (time: number) => void) {
        this.tickListeners = this.tickListeners.filter(l => l !== listener);
    }
    public addEndListener(listener: (session: PomodoroSession) => void) {
        this.endListeners.push(listener);
    }
    public removeEndListener(listener: (session: PomodoroSession) => void) {
        this.endListeners = this.endListeners.filter(l => l !== listener);
    }

    // setCallbacks is no longer needed due to add/remove listener pattern
    // setCallbacks(onTickCallback: (time: number) => void, onEndCallback: (session: PomodoroSession) => void) {
    //     this.addTickListener(onTickCallback);
    //     this.addEndListener(onEndCallback);
    // }

    start(durationMinutes: number, taskTitle?: string, projectId?: string) {
        if (this.isRunning) {
            this.stop(true); // Stop current session if one is running, mark as interrupted
        }

        this.currentSessionDuration = durationMinutes;
        this.remainingTime = durationMinutes * 60;
        this.sessionStartTime = new Date().toISOString();
        this.currentTaskTitle = taskTitle;
        this.currentProjectId = projectId;
        this.isRunning = true;

        this.tickListeners.forEach(listener => listener(this.remainingTime)); // Initial tick

        this.timerId = setInterval(() => {
            this.remainingTime--;
            this.tickListeners.forEach(listener => listener(this.remainingTime));

            if (this.remainingTime <= 0) {
                this.completeSession('completed');
            }
        }, 1000);
        console.log(`Pomodoro started: ${durationMinutes} min, Task: ${taskTitle || 'N/A'}`);
    }

    pause() {
        if (!this.isRunning) return;
        clearInterval(this.timerId);
        this.isRunning = false;
        console.log('Pomodoro paused');
        // Optionally, could emit a 'pause' event here if needed
        // For now, isRunning and getRemainingTime will reflect the paused state for UI.
        // We should still call tickListeners so the UI can update to show the paused time.
        this.tickListeners.forEach(listener => listener(this.remainingTime));
    }

    resume() {
        if (this.isRunning || this.remainingTime <= 0) return;
        this.isRunning = true;
        // sessionStartTime remains from the original start time
        this.timerId = setInterval(() => {
            this.remainingTime--;
            this.tickListeners.forEach(listener => listener(this.remainingTime));
            if (this.remainingTime <= 0) {
                this.completeSession('completed');
            }
        }, 1000);
        console.log('Pomodoro resumed');
    }

    stop(interrupted: boolean = true) {
        this.completeSession(interrupted ? 'interrupted' : 'completed');
    }
    
    private completeSession(status: 'completed' | 'interrupted') {
        clearInterval(this.timerId);
        this.isRunning = false;
        
        if (this.sessionStartTime) { // Check if a session was actually started
            const session: PomodoroSession = {
                id: `pom-${new Date(this.sessionStartTime).getTime()}`, // Simple unique ID
                startTime: this.sessionStartTime,
                duration: this.currentSessionDuration,
                task_title: this.currentTaskTitle,
                projectId: this.currentProjectId,
                status: status,
            };
            // Call all end listeners
            this.endListeners.forEach(listener => listener(session));
        }
        
        console.log(`Pomodoro session ended with status: ${status}`);
        // Reset for next session
        this.remainingTime = 0;
        this.sessionStartTime = null;
        this.currentTaskTitle = undefined;
        this.currentProjectId = undefined;
        this.currentSessionDuration = 0;
        // Ensure final tick is sent for remainingTime = 0 if not already
        this.tickListeners.forEach(listener => listener(this.remainingTime));
    }

    getRemainingTime = (): number => this.remainingTime;
    getIsRunning = (): boolean => this.isRunning;
}

// Export a singleton instance of the timer
export const pomodoroTimer = new PomodoroTimer();

// --- Logging Function ---
export async function logPomodoroSession(session: PomodoroSession, date?: string, currentApp?: App): Promise<void> {
    const appInstance = currentApp || _app;
    const logDate = date || new Date(session.startTime).toISOString().slice(0, 10);

    if (!appInstance || !appInstance.fileManager || !appInstance.vault) {
        console.warn(`[logPomodoroSession] Obsidian App instance not available for date ${logDate}. Using conceptual log.`);
        // Conceptual/Simulated path
        let rawContent = await _conceptualReadDailyNoteContent(logDate);
        if (rawContent === null) { // Note might not exist conceptually
            rawContent = `---
date: ${logDate}
type: daily-note
pomodoro_sessions: []
---
# ${logDate} - Created by Pomodoro Logger
`;
        }
        let { frontmatter, content } = parseMarkdownWithFrontmatter(rawContent);
        
        frontmatter.pomodoro_sessions = frontmatter.pomodoro_sessions || [];
        if (!Array.isArray(frontmatter.pomodoro_sessions)) { // Defensive
            frontmatter.pomodoro_sessions = [];
        }
        frontmatter.pomodoro_sessions.push(session);
        
        const newFileContent = stringifyMarkdownWithFrontmatter(frontmatter, content);
        await _conceptualWriteDailyNoteContent(logDate, newFileContent);
        console.log(`[logPomodoroSession - Conceptual] Logged session ${session.id} to ${logDate}`);
        return;
    }

    // Obsidian API path
    const dailyNotePath = getDailyNotePath(logDate);
    let file = appInstance.vault.getAbstractFileByPath(dailyNotePath);

    if (!(file instanceof TFile)) {
        console.log(`[logPomodoroSession] Daily note ${dailyNotePath} not found. Creating it.`);
        try {
            const defaultContent = `---
date: ${logDate}
type: daily-note
pomodoro_sessions: []
---

# ${logDate}
`;
            file = await appInstance.vault.create(dailyNotePath, defaultContent);
            if (!(file instanceof TFile)) {
                 console.error("[logPomodoroSession] Failed to create daily note:", dailyNotePath);
                 return;
            }
        } catch (e) {
            console.error("[logPomodoroSession] Error creating daily note:", e);
            return;
        }
    }
    
    await appInstance.fileManager.processFrontMatter(file as TFile, (fm) => {
        fm.pomodoro_sessions = fm.pomodoro_sessions || [];
        if (!Array.isArray(fm.pomodoro_sessions)) { // Defensive
            console.warn("[logPomodoroSession] pomodoro_sessions was not an array, re-initializing.");
            fm.pomodoro_sessions = [];
        }
        fm.pomodoro_sessions.push(session);
    });
    console.log(`[logPomodoroSession] Pomodoro session ${session.id} logged to ${dailyNotePath}`);
}
