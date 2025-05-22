<script lang="ts">
    import { onMount } from 'svelte';
    import type { App } from 'obsidian';
    import { createGoal, type CreateGoalParams, type KeyResult } from '../modules/goal-alignment/GoalManager';
    import { loadValues } from '../modules/goal-alignment/ValuesManager';

    export let app: App;
    export let modalActions: { 
        close: () => void; 
        submit: (params: CreateGoalParams) => Promise<void>; 
    };

    // Common state variables
    let title: string = "";
    let description: string = "";
    let dueDate: string = ""; // YYYY-MM-DD
    let parentGoalId: string = "";
    let visionId: string = "";
    
    let availableValues: string[] = [];
    let selectedValues: string[] = [];
    
    let templateType: "None" | "SMART" | "OKR" | "WOOP" = "None";
    
    // OKR specific
    let okrObjective: string = "";
    // Initialize with one KR, but allow for more fields from KeyResult interface
    let okrKeyResults: Array<Partial<KeyResult> & { title: string }> = [{ title: "" }]; 
    
    // WOOP specific
    let woopWish: string = "";
    let woopOutcome: string = "";
    let woopObstacle: string = "";
    let woopPlan: string = "";

    let accountabilityPartner: string = ""; // Added
    
    let isLoadingValues: boolean = false;

    onMount(async () => {
        isLoadingValues = true;
        try {
            availableValues = await loadValues(app);
        } catch (e) {
            console.error("Error loading personal values:", e);
            // Optionally show a notice to the user
        } finally {
            isLoadingValues = false;
        }
    });

    function addKr() {
        okrKeyResults = [...okrKeyResults, { title: "" }];
    }

    function removeKr(index: number) {
        okrKeyResults = okrKeyResults.filter((_, i) => i !== index);
    }

    async function handleSubmit() {
        if (!title.trim()) {
            alert("Goal title is required."); // Or use Obsidian Notice
            return;
        }

        const params: CreateGoalParams = {
            title: title.trim(),
            description: description.trim() || undefined,
            dueDate: dueDate || undefined,
            parentGoalId: parentGoalId.trim() || undefined,
            visionId: visionId.trim() || undefined,
            templateType: templateType === "None" ? undefined : templateType,
            alignedValues: selectedValues.length > 0 ? selectedValues : undefined,
            
            okrObjective: templateType === "OKR" ? (okrObjective.trim() || undefined) : undefined,
            okrKeyResults: templateType === "OKR" ? okrKeyResults.filter(kr => kr.title && kr.title.trim() !== '').map(kr => ({ // Ensure kr.title is defined
                kr_title: kr.title.trim(), // map to full KeyResult structure
                kr_status: kr.kr_status || 'todo', // default status
                kr_target_value: kr.kr_target_value,
                kr_current_value: kr.kr_current_value,
                kr_type: kr.kr_type
            })) : undefined,
            
            woopWish: templateType === "WOOP" ? (woopWish.trim() || undefined) : undefined,
            woopOutcome: templateType === "WOOP" ? (woopOutcome.trim() || undefined) : undefined,
            woopObstacle: templateType === "WOOP" ? (woopObstacle.trim() || undefined) : undefined,
            woopPlan: templateType === "WOOP" ? (woopPlan.trim() || undefined) : undefined,
            accountability_partner: accountabilityPartner.trim() || undefined, // Added
        };
        await modalActions.submit(params);
    }
</script>

<div class="create-goal-modal-content">
    <h2>Create New Goal</h2>

    <label for="goal-title">Title <span class="required-star">*</span></label>
    <input id="goal-title" type="text" bind:value={title} required placeholder="e.g., Learn Svelte for plugin development" />

    <label for="goal-description">Description</label>
    <textarea id="goal-description" bind:value={description} placeholder="e.g., Complete online courses and build a small project."></textarea>

    <label for="goal-due-date">Due Date</label>
    <input id="goal-due-date" type="date" bind:value={dueDate} />

    <label for="goal-parent-id">Parent Goal ID</label>
    <input id="goal-parent-id" type="text" bind:value={parentGoalId} placeholder="Optional ID of a larger goal" />

    <label for="goal-vision-id">Vision ID</label>
    <input id="goal-vision-id" type="text" bind:value={visionId} placeholder="Optional ID of a guiding vision" />

    <label for="goal-accountability-partner">Accountability Partner (optional)</label>
    <input id="goal-accountability-partner" type="text" bind:value={accountabilityPartner} placeholder="Name or [[wikilink]]" />

    <label for="goal-aligned-values">Aligned Values {#if isLoadingValues}(loading...){/if}</label>
    <select id="goal-aligned-values" multiple bind:value={selectedValues} disabled={isLoadingValues}>
        {#each availableValues as val}
            <option value={val}>{val}</option>
        {/each}
    </select>
    {#if availableValues.length === 0 && !isLoadingValues}
        <p class="no-values-note">No personal values found. You can define them using the "Define/Review Personal Values" command.</p>
    {/if}


    <label for="goal-template-type">Template</label>
    <select id="goal-template-type" bind:value={templateType}>
        <option value="None">None (Generic)</option>
        <option value="SMART">SMART</option>
        <option value="OKR">OKR</option>
        <option value="WOOP">WOOP</option>
    </select>

    {#if templateType === "OKR"}
    <fieldset>
        <legend>OKR Details</legend>
        <label for="okr-objective">Objective</label>
        <input id="okr-objective" type="text" bind:value={okrObjective} placeholder="e.g., Master Svelte fundamentals" />
        
        Key Results:
        {#each okrKeyResults as kr, i}
        <div class="kr-item">
            <input type="text" bind:value={kr.title} placeholder="KR Title (e.g., Complete Svelte tutorial)" />
            <!-- Optional: Add inputs for kr_status, kr_target_value, etc. here -->
            <!-- Example for status: 
            <select bind:value={kr.kr_status}>
                <option value="todo">To Do</option>
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
            </select> 
            -->
            <button type="button" on:click={() => removeKr(i)} class="remove-kr-button" title="Remove Key Result">×</button>
        </div>
        {/each}
        <button type="button" on:click={addKr} class="add-kr-button">Add Key Result</button>
    </fieldset>
    {/if}

    {#if templateType === "WOOP"}
    <fieldset>
        <legend>WOOP Details</legend>
        <label for="woop-wish">Wish</label>
        <input id="woop-wish" type="text" bind:value={woopWish} placeholder="e.g., I will consistently study Svelte for 1 hour daily." />
        
        <label for="woop-outcome">Outcome</label>
        <input id="woop-outcome" type="text" bind:value={woopOutcome} placeholder="e.g., I will feel confident building UIs with Svelte." />
        
        <label for="woop-obstacle">Obstacle</label>
        <input id="woop-obstacle" type="text" bind:value={woopObstacle} placeholder="e.g., Getting distracted by other tasks." />
        
        <label for="woop-plan">Plan (If... Then...)</label>
        <input id="woop-plan" type="text" bind:value={woopPlan} placeholder="e.g., If I get distracted, then I will use the Pomodoro timer." />
    </fieldset>
    {/if}

    <div class="modal-actions">
        <button type="button" on:click={handleSubmit} class="mod-cta">Create Goal</button>
        <button type="button" on:click={modalActions.close}>Cancel</button>
    </div>
</div>

<style>
    .create-goal-modal-content {
        display: flex;
        flex-direction: column;
        gap: 10px; /* Consistent spacing between elements */
    }
    label { 
        display: block; 
        margin-bottom: 2px; /* Reduced margin for tighter layout */
        font-weight: 500;
    }
    input[type="text"],
    input[type="date"],
    textarea,
    select { 
        width: 100%; 
        padding: 8px;
        margin-bottom: 8px; /* Spacing after input element */
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background-color: var(--background-primary);
        color: var(--text-normal);
        box-sizing: border-box;
    }
    textarea {
        min-height: 60px;
        resize: vertical;
    }
    select[multiple] {
        min-height: 80px;
    }
    fieldset { 
        border: 1px solid var(--background-modifier-border); 
        padding: 10px 15px; 
        margin-top: 10px;
        border-radius: 4px;
    }
    legend { 
        font-weight: bold; 
        padding: 0 5px;
        margin-left: 5px; /* Align with fieldset padding */
    }
    .required-star {
        color: var(--text-error);
        margin-left: 2px;
    }
    .no-values-note {
        font-size: 0.85em;
        color: var(--text-muted);
        margin-top: -5px;
        margin-bottom: 8px;
    }
    .kr-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }
    .kr-item input[type="text"] {
        flex-grow: 1;
        margin-bottom: 0; /* Remove bottom margin as gap is handled by flex */
    }
    .remove-kr-button, .add-kr-button {
        padding: 6px 10px;
        font-size: 0.9em;
        /* Standard button styling will be inherited or can be customized */
    }
    .remove-kr-button {
        background-color: transparent;
        border: none;
        color: var(--text-muted);
        font-weight: bold;
        font-size: 1.2em;
    }
    .remove-kr-button:hover {
        color: var(--text-error);
    }
    .modal-actions {
        margin-top: 15px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    /* Standard Obsidian button classes like mod-cta can be used for primary action */
</style>
