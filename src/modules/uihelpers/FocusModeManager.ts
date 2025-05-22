// src/modules/uihelpers/FocusModeManager.ts

let isCurrentlyActive: boolean = false;
let currentTaskTitle: string = "";
let currentTaskDetails: string | undefined = undefined;

// Optional: Store the Svelte component instance if managed here
// let focusModeComponentInstance: any = null; 
// Or use an event emitter to signal UI to show/hide

const FOCUS_MODE_BODY_CLASS = 'life-planner-focus-mode';

// Callback to be set by the UI layer (e.g., main.ts) to show/hide the Svelte component
type DisplayFocusUICallback = (show: boolean, title: string, details?: string) => void;
let displayFocusUICallback: DisplayFocusUICallback | null = null;

export function setDisplayFocusUICallback(callback: DisplayFocusUICallback) {
    displayFocusUICallback = callback;
}

export function enterFocusMode(taskTitle: string, taskDetails?: string): void {
    if (isCurrentlyActive) return;

    currentTaskTitle = taskTitle;
    currentTaskDetails = taskDetails;
    isCurrentlyActive = true;
    document.body.classList.add(FOCUS_MODE_BODY_CLASS);
    
    if (displayFocusUICallback) {
        displayFocusUICallback(true, currentTaskTitle, currentTaskDetails);
    }
    console.log("Entered Focus Mode with task:", taskTitle);
}

export function exitFocusMode(): void {
    if (!isCurrentlyActive) return;

    isCurrentlyActive = false;
    document.body.classList.remove(FOCUS_MODE_BODY_CLASS);
    
    if (displayFocusUICallback) {
        displayFocusUICallback(false, "", ""); // Signal to hide
    }
    currentTaskTitle = "";
    currentTaskDetails = undefined;
    console.log("Exited Focus Mode");
}

export function isFocusModeActive(): boolean {
    return isCurrentlyActive;
}

export function getFocusTask(): { title: string; details?: string } | null {
    if (!isCurrentlyActive) return null;
    return { title: currentTaskTitle, details: currentTaskDetails };
}
