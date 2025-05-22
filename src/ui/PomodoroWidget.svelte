<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { pomodoroTimer, logPomodoroSession, type PomodoroSession } from '../modules/time-management/PomodoroTracker';
    // To use Obsidian App context if needed for logPomodoroSession:
    // import type { App } from 'obsidian';
    // import { getContext } from 'svelte';
    // const app = getContext<App>('app'); // This assumes 'app' is set in context by a parent component

    let remainingTime: number = pomodoroTimer.getRemainingTime();
    let isRunning: boolean = pomodoroTimer.getIsRunning();
    let taskTitle: string = "";
    let durationMinutes: number = 25; // Default Pomodoro length

    function formatTime(totalSeconds: number): string {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    const handleTick = (time: number) => {
        remainingTime = time;
    };

    const handleEnd = async (session: PomodoroSession) => {
        isRunning = false; // Timer stops itself before calling onEnd
        remainingTime = 0; 
        if (session.status === 'completed') {
            // Pass app context if your logPomodoroSession requires it.
            // The logPomodoroSession function from PomodoroTracker.ts is designed to use
            // its internally stored _app instance if initPomodoroTracker(app) was called,
            // or fall back to conceptual logging if _app is not available.
            await logPomodoroSession(session /*, undefined, app */); // Pass app as third argument if needed
            alert(`Pomodoro '${session.task_title || 'session'}' completed!`);
            taskTitle = ""; // Clear task title after successful completion and logging
        } else {
            alert(`Pomodoro '${session.task_title || 'session'}' interrupted.`);
        }
    };

    onMount(() => {
        // Initialize state from the timer
        remainingTime = pomodoroTimer.getRemainingTime();
        isRunning = pomodoroTimer.getIsRunning();
        
        // Set callbacks using the new listener methods
        pomodoroTimer.addTickListener(handleTick);
        pomodoroTimer.addEndListener(handleEnd);
    });

    onDestroy(() => {
        // Remove listeners to prevent memory leaks and unwanted calls
        pomodoroTimer.removeTickListener(handleTick);
        pomodoroTimer.removeEndListener(handleEnd);
    });

    function startPomodoro() {
        pomodoroTimer.start(durationMinutes, taskTitle);
        isRunning = pomodoroTimer.getIsRunning(); // Update UI state
    }

    function pausePomodoro() {
        pomodoroTimer.pause();
        isRunning = pomodoroTimer.getIsRunning();
    }

    function resumePomodoro() {
        pomodoroTimer.resume();
        isRunning = pomodoroTimer.getIsRunning();
    }

    function stopPomodoro() {
        pomodoroTimer.stop(true); // true for interrupted
        // isRunning state will be updated by handleEnd callback
    }

</script>

<div class="pomodoro-widget">
    <h3>Pomodoro Timer</h3>
    <div class="time-display">{formatTime(remainingTime)}</div>
    
    <div class="controls">
        {#if !isRunning && remainingTime === 0}
            <input type="text" bind:value={taskTitle} placeholder="Task description (optional)" />
            <input type="number" bind:value={durationMinutes} min="1" max="120" title="Duration (minutes)" style="width: 70px; margin-left: 5px;" />
            <button on:click={startPomodoro}>Start</button>
        {:else if isRunning}
            <button on:click={pausePomodoro}>Pause</button>
            <button on:click={stopPomodoro}>Stop</button>
        {:else if !isRunning && remainingTime > 0}
            <button on:click={resumePomodoro}>Resume</button>
            <button on:click={stopPomodoro}>Stop</button>
        {/if}
    </div>
    {#if taskTitle && (isRunning || (!isRunning && remainingTime > 0))}
        <p>Working on: {taskTitle}</p>
    {/if}
</div>

<style>
    .pomodoro-widget {
        padding: 15px; /* Increased padding */
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px; /* Slightly more rounded corners */
        text-align: center;
        background-color: var(--background-secondary); /* Use theme variable */
    }
    .time-display {
        font-size: 3em; /* Larger font */
        margin: 15px 0 20px; /* Adjusted margin */
        font-family: monospace;
        color: var(--text-normal); /* Use theme variable */
    }
    .controls {
        margin-bottom: 10px; /* Added margin below controls */
    }
    .controls button {
        margin: 5px;
        padding: 8px 12px; /* Adjusted padding */
        /* Standard button styling from theme would ideally apply here */
    }
    .controls input[type="text"], .controls input[type="number"] {
        margin: 5px;
        padding: 8px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 3px;
        background-color: var(--background-primary); /* Use theme variable */
        color: var(--text-normal); /* Use theme variable */
    }
    p {
        font-size: 0.9em;
        color: var(--text-muted); /* Use theme variable */
    }
</style>
