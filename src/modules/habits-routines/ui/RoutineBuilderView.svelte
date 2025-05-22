<script lang="ts">
  import { onMount } from 'svelte';
  import * as RoutineBuilder from '../RoutineBuilder'; // Path to your RoutineBuilder logic
  import type { Routine, RoutineSchedule, RoutineScheduleType } from '../types'; // Path to your types
  // Optional: Import Habit types/functions if you want to display habit names later
  // import * as HabitTracker from '../HabitTracker';
  // import type { Habit } from '../types';

  let routines: Routine[] = [];
  let showAddRoutineForm = false;

  // Form fields for new routine
  let newRoutineName = '';
  let newRoutineDescription = '';
  let newRoutineScheduleType: RoutineScheduleType = 'on_demand';
  let newRoutineScheduleTime: string = ''; // e.g., "08:00"
  let newRoutineScheduleDays: string = ''; // Comma-separated numbers for weekly

  async function loadRoutines() {
    routines = RoutineBuilder.getAllRoutines();
    // If you want to resolve habit names:
    // routines = routines.map(r => ({
    //   ...r,
    //   habits: r.habitIds.map(id => HabitTracker.getHabit(id)?.name || 'Unknown Habit') 
    // }));
  }

  async function handleAddRoutine() {
    if (!newRoutineName.trim()) {
      alert('Routine name cannot be empty.');
      return;
    }

    let schedule: RoutineSchedule | undefined = undefined;
    if (newRoutineScheduleType !== 'on_demand') {
        schedule = { type: newRoutineScheduleType };
        if (newRoutineScheduleTime) {
            schedule.time = newRoutineScheduleTime;
        }
        if (newRoutineScheduleType === 'weekly') {
            const days = newRoutineScheduleDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 0 && d <=6);
            if (days.length === 0 && newRoutineScheduleType === 'weekly') { // Require days if weekly
                 alert('Please specify valid days for weekly frequency (e.g., 1,3,5 for Mon,Wed,Fri).');
                 return;
            }
            schedule.days = days;
        }
    }
    
    RoutineBuilder.addRoutine(
      newRoutineName,
      newRoutineDescription || undefined,
      [], // Start with an empty list of habit IDs
      schedule
    );
    
    // Reset form and reload routines
    newRoutineName = '';
    newRoutineDescription = '';
    newRoutineScheduleType = 'on_demand';
    newRoutineScheduleTime = '';
    newRoutineScheduleDays = '';
    showAddRoutineForm = false;
    loadRoutines();
  }
  
  function getScheduleDisplay(schedule?: RoutineSchedule): string {
    if (!schedule) return 'On Demand';
    let display = `Type: ${schedule.type}`;
    if (schedule.time) display += `, Time: ${schedule.time}`;
    if (schedule.days && schedule.days.length > 0) display += `, Days: ${schedule.days.join(',')}`;
    return display;
  }

  onMount(() => {
    loadRoutines();
  });

</script>

<div class="routine-builder-view">
  <h2>Routine Builder</h2>

  <button on:click={() => showAddRoutineForm = !showAddRoutineForm}>
    {#if showAddRoutineForm}Hide Form{:else}Add New Routine{/if}
  </button>

  {#if showAddRoutineForm}
    <div class="add-routine-form">
      <h3>Add New Routine</h3>
      <div>
        <label for="routine-name">Name:</label>
        <input type="text" id="routine-name" bind:value={newRoutineName} required />
      </div>
      <div>
        <label for="routine-desc">Description (Optional):</label>
        <input type="text" id="routine-desc" bind:value={newRoutineDescription} />
      </div>
      <div>
        <label for="routine-schedule-type">Schedule Type:</label>
        <select id="routine-schedule-type" bind:value={newRoutineScheduleType}>
          <option value="on_demand">On Demand</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      {#if newRoutineScheduleType === 'daily' || newRoutineScheduleType === 'weekly'}
      <div>
        <label for="routine-schedule-time">Time (Optional, e.g., 08:00):</label>
        <input type="time" id="routine-schedule-time" bind:value={newRoutineScheduleTime} />
      </div>
      {/if}
      {#if newRoutineScheduleType === 'weekly'}
      <div>
        <label for="routine-schedule-days">Days (0-6, comma-separated, e.g., 1,3,5 for Mon,Wed,Fri):</label>
        <input type="text" id="routine-schedule-days" bind:value={newRoutineScheduleDays} />
      </div>
      {/if}
      <button on:click={handleAddRoutine}>Save Routine</button>
    </div>
  {/if}

  <div class="routine-list">
    <h3>Your Routines</h3>
    {#if routines.length === 0}
      <p>No routines yet. Add one to get started!</p>
    {:else}
      <ul>
        {#each routines as routine (routine.id)}
          <li>
            <div class="routine-info">
              <strong>{routine.name}</strong>
              {#if routine.description}<p class="description">{routine.description}</p>{/if}
              <p class="schedule">Schedule: {getScheduleDisplay(routine.schedule)}</p>
              <p class="habits">Habits: ({routine.habitIds.length}) IDs: {routine.habitIds.join(', ') || 'None'}</p>
              <!-- Placeholder for displaying habit names and managing them -->
              <small><em>(Full habit display and management coming soon)</em></small>
            </div>
            <!-- Placeholder for buttons like "Edit", "Delete", "Add Habit" -->
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .routine-builder-view {
    padding: 15px;
    font-family: sans-serif;
  }
  .add-routine-form {
    margin-top: 15px;
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  .add-routine-form div {
    margin-bottom: 10px;
  }
  .add-routine-form label {
    display: block;
    margin-bottom: 5px;
  }
  .add-routine-form input[type="text"],
  .add-routine-form input[type="time"],
  .add-routine-form select {
    width: 95%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 3px;
  }
  .routine-list ul {
    list-style: none;
    padding: 0;
  }
  .routine-list li {
    background-color: #f9f9f9;
    border: 1px solid #eee;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
  }
  .routine-info .description {
    font-size: 0.9em;
    color: #555;
  }
  .routine-info .schedule, .routine-info .habits {
    font-size: 0.85em;
    color: #333;
    margin: 3px 0;
  }
</style>
