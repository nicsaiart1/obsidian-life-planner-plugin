<script lang="ts">
    import { onMount } from 'svelte';
    import type { App } from 'obsidian';
    import { getAllTasksFromVault, filterTasksForBacklog, type Task } from '../modules/tasks/TaskQueryEngine';

    export let app: App;

    let backlogTasks: Task[] = [];
    let isLoading: boolean = true;
    let error: string | null = null;
    let sortCriteria: 'due_date' | 'title' = 'due_date';
    let sortDirection: 'asc' | 'desc' = 'asc';
    let selectedEnergyFilter: "low" | "medium" | "high" | "not_set" | null = null; // null for 'Any'


    async function applyAndSortFilters() {
        isLoading = true; 
        error = null;
        try {
            const allTasks = await getAllTasksFromVault(app); 
            let displayTasks = filterTasksForBacklog(allTasks);

            if (selectedEnergyFilter) {
                if (selectedEnergyFilter === "not_set") {
                    displayTasks = displayTasks.filter(task => !task.energy_level);
                } else {
                    displayTasks = displayTasks.filter(task => task.energy_level === selectedEnergyFilter);
                }
            }
            backlogTasks = sortTasks(displayTasks); 
        } catch (e: any) {
            error = "Failed to load/filter tasks: " + e.message;
            console.error("Error loading/filtering tasks:", e);
        } finally {
            isLoading = false;
        }
    }
    
    function handleEnergyFilterChange(newFilter: typeof selectedEnergyFilter) {
        selectedEnergyFilter = newFilter;
        applyAndSortFilters(); 
    }

    function sortTasks(tasks: Task[]): Task[] {
        // Create a new array to avoid mutating the original
        const tasksToSort = [...tasks];
        
        tasksToSort.sort((a, b) => {
            let comparison = 0;
            if (sortCriteria === 'due_date') {
                const dateA = a.due_date ? new Date(a.due_date).getTime() : null;
                const dateB = b.due_date ? new Date(b.due_date).getTime() : null;

                if (dateA === null && dateB === null) comparison = 0;
                else if (dateA === null) comparison = sortDirection === 'asc' ? 1 : -1; // Nulls last in asc, first in desc
                else if (dateB === null) comparison = sortDirection === 'asc' ? -1 : 1; // Nulls last in asc, first in desc
                else comparison = dateA - dateB;

            } else if (sortCriteria === 'title') {
                comparison = a.title.localeCompare(b.title);
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
        return tasksToSort;
    }

    onMount(applyAndSortFilters); // Initial load

    function handleSortChange(criteria: 'due_date' | 'title') {
        if (sortCriteria === criteria) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortCriteria = criteria;
            sortDirection = 'asc'; // Default to ascending when changing criteria
        }
        // Re-apply filters and sort when sort criteria changes, as the displayed list might change
        applyAndSortFilters(); 
    }

    function openTaskNote(filePath: string) {
        // Using false for the last argument to open in the current leaf if possible, or a new one if not.
        // Use true if you always want to try to open in a new leaf.
        app.workspace.openLinkText(filePath, filePath, false);
    }

    function isOverdue(dueDateStr: string | null | undefined): boolean {
        if (!dueDateStr) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare against start of today
        
        // Parse dueDateStr carefully
        const [year, month, day] = dueDateStr.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return false; // Invalid date format
        const dueDate = new Date(year, month - 1, day); // Month is 0-indexed

        return dueDate < today;
    }
</script>

<div class="backlog-view-component">
    <h2>Backlog Tasks</h2>
    <div class="controls">
        <div class="sort-controls">
            <button on:click={() => handleSortChange('due_date')} class:active={sortCriteria === 'due_date'}>
                Sort by Due Date 
                {#if sortCriteria === 'due_date'}
                    ({sortDirection === 'asc' ? '▲ Asc' : '▼ Desc'})
                {/if}
            </button>
            <button on:click={() => handleSortChange('title')} class:active={sortCriteria === 'title'}>
                Sort by Title 
                {#if sortCriteria === 'title'}
                    ({sortDirection === 'asc' ? '▲ Asc' : '▼ Desc'})
                {/if}
            </button>
        </div>
        <div class="energy-filters">
            <span>Filter Energy:</span>
            <button class:active={selectedEnergyFilter === null} on:click={() => handleEnergyFilterChange(null)}>Any</button>
            <button class:active={selectedEnergyFilter === 'low'} on:click={() => handleEnergyFilterChange('low')}>Low</button>
            <button class:active={selectedEnergyFilter === 'medium'} on:click={() => handleEnergyFilterChange('medium')}>Medium</button>
            <button class:active={selectedEnergyFilter === 'high'} on:click={() => handleEnergyFilterChange('high')}>High</button>
            <button class:active={selectedEnergyFilter === 'not_set'} on:click={() => handleEnergyFilterChange('not_set')}>Not Set</button>
        </div>
        <button on:click={applyAndSortFilters} title="Refresh tasks" class="refresh-button">🔄 Refresh</button>
    </div>

    {#if isLoading}
        <p>Loading tasks...</p>
    {:else if error}
        <p class="error-message">{error}</p>
    {:else if backlogTasks.length === 0}
        <p>🎉 Your backlog is empty{selectedEnergyFilter ? ` for energy level '${selectedEnergyFilter === "not_set" ? "Not Set" : selectedEnergyFilter}'` : ''}!</p>
    {:else}
        <ul class="backlog-task-list">
            {#each backlogTasks as task (task.id)}
                <li class="backlog-task-item">
                    <div class="task-main-info">
                        <strong 
                            class:overdue={task.due_date && isOverdue(task.due_date)}
                            on:click={() => openTaskNote(task.filePath)}
                            on:keydown={(e) => e.key === 'Enter' && openTaskNote(task.filePath)}
                            role="button"
                            tabindex="0"
                            title="Click to open note: {task.filePath}"
                            class="task-title"
                        >
                            {task.title}
                        </strong>
                        {#if task.due_date}
                            <span class="due-date {isOverdue(task.due_date) ? 'overdue-text' : ''}">
                                (Due: {task.due_date})
                            </span>
                        {/if}
                    </div>
                    <div class="task-meta-info">
                        {#if task.project_id}
                            <span class="project-id" title="Project ID: {task.project_id}">📦 {task.project_id}</span>
                        {/if}
                        {#if task.energy_level}
                            <span class="energy-level">(⚡{task.energy_level})</span>
                        {/if}
                         <!-- Optional: Display file path for context or debugging -->
                         <!-- <span class="file-path" title="File Path">{task.filePath}</span> -->
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .backlog-view-component { 
        padding: 15px; 
        font-family: var(--font-interface);
    }
    .controls {
        margin-bottom: 15px;
        display: flex;
        flex-wrap: wrap; /* Allow controls to wrap on smaller screens */
        gap: 10px; 
        align-items: center;
    }
    .sort-controls {
        display: flex;
        gap: 10px;
    }
    .energy-filters {
        display: flex;
        gap: 5px;
        align-items: center;
        margin-left: 10px; /* Space from sort controls */
    }
    .energy-filters span {
        margin-right: 5px;
        font-size: 0.9em;
        color: var(--text-muted);
    }
    .controls button { /* General button styling for controls */
        padding: 6px 10px;
        border: 1px solid var(--background-modifier-border);
        background-color: var(--background-secondary-alt);
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .controls button:hover {
        background-color: var(--background-modifier-hover);
    }
    .controls button.active { /* Specific for active sort/filter buttons */
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
        border-color: var(--interactive-accent-hover);
    }
    .refresh-button {
        margin-left: auto; /* Pushes refresh button to the right in flex container */
    }

    .error-message {
        color: var(--text-error);
        background-color: var(--background-primary-alt);
        border: 1px solid var(--background-modifier-error-border);
        padding: 10px;
        border-radius: 5px;
    }

    .backlog-task-list {
        list-style: none;
        padding: 0;
    }
    .backlog-task-item { 
        margin-bottom: 10px; 
        padding: 10px; 
        border: 1px solid var(--background-modifier-border);
        border-radius: 5px;
        background-color: var(--background-primary);
        transition: background-color 0.2s;
    }
    .backlog-task-item:hover {
        background-color: var(--background-secondary);
    }
    .task-title {
        cursor: pointer;
        color: var(--text-normal);
    }
    .task-title:hover {
        text-decoration: underline;
    }
    .task-main-info {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
    }
    .task-meta-info {
        font-size: 0.85em;
        display: flex; /* To align project_id and energy_level on the same line */
        gap: 8px; /* Space between meta items */
        align-items: center;
    }
    .backlog-task-item strong.overdue { 
        color: var(--text-error); 
        font-weight: bold; 
    }
    .due-date { 
        font-size: 0.9em; 
        color: var(--text-muted); 
        margin-left: 10px; 
    }
    .due-date.overdue-text { 
        color: var(--text-error); 
        font-weight: bold;
    }
    .project-id { 
        font-size: 0.85em; 
        color: var(--text-faint); 
        background-color: var(--background-secondary-alt); 
        padding: 2px 6px; 
        border-radius: 4px;
        /* margin-right: 8px; -- Replaced by gap in task-meta-info */
    }
    .energy-level { 
        font-size: 0.9em; 
        color: var(--text-normal); 
        /* margin-left: 8px; -- Replaced by gap in task-meta-info */
        background-color: var(--background-secondary-alt); 
        padding: 1px 3px; 
        border-radius: 3px; 
    }
    .file-path {
        font-size: 0.8em;
        color: var(--text-faint);
        margin-left: 8px;
        font-style: italic;
    }
</style>
