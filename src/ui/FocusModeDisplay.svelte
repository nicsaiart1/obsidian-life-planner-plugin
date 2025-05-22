<script lang="ts">
    import { exitFocusMode } from '../modules/uihelpers/FocusModeManager'; // Adjust path if needed

    export let taskTitle: string = "Focus Task";
    export let taskDetails: string | undefined = undefined;
</script>

<div class="focus-mode-overlay" role="dialog" aria-modal="true" aria-labelledby="focus-task-title">
    <div class="focus-content">
        <h1 id="focus-task-title">{taskTitle}</h1>
        {#if taskDetails}
            <p class="task-details">{taskDetails}</p>
        {/if}
        <button class="exit-focus-button" on:click={exitFocusMode}>Exit Focus Mode</button>
    </div>
</div>

<style>
    .focus-mode-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: var(--background-primary-alt, rgba(0,0,0,0.9)); /* Fallback if variable not found */
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000; /* High z-index */
        color: var(--text-normal);
        padding: 20px;
        box-sizing: border-box;
    }

    .focus-content {
        text-align: center;
        max-width: 80%;
    }

    #focus-task-title {
        font-size: 3em; /* Make it prominent */
        margin-bottom: 20px;
        color: var(--text-title-h1, var(--text-normal));
    }

    .task-details {
        font-size: 1.2em;
        margin-bottom: 40px;
        color: var(--text-muted, var(--text-normal));
        white-space: pre-wrap; /* Respect newlines in details */
    }

    .exit-focus-button {
        padding: 10px 20px;
        font-size: 1em;
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    .exit-focus-button:hover {
        background-color: var(--interactive-accent-hover);
    }
</style>
