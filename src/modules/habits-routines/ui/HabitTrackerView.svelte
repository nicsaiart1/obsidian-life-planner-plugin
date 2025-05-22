<script lang="ts">
  import { onMount } from 'svelte';
  import * as HabitTracker from '../HabitTracker'; // Path to your HabitTracker logic
  import type { Habit, HabitFrequency, HabitFrequencyType } from '../types'; // Path to your types

  let habits: Habit[] = [];
  let showAddHabitForm = false;

  // Form fields for new habit
  let newHabitName = '';
  let newHabitDescription = '';
  let newHabitFrequencyType: HabitFrequencyType = 'daily';
  let newHabitFrequencyDays: string = ''; // Comma-separated numbers for specific_days or weekly
  let newHabitTarget: number | undefined = undefined;
  let newHabitTargetUnit: string = '';
  
  async function loadHabits() {
    habits = HabitTracker.getAllHabits();
  }

  async function handleAddHabit() {
    if (!newHabitName.trim()) {
      alert('Habit name cannot be empty.');
      return;
    }

    let frequency: HabitFrequency;
    switch (newHabitFrequencyType) {
        case 'daily':
            frequency = { type: 'daily' };
            break;
        case 'weekly':
            const weeklyDays = newHabitFrequencyDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 0 && d <=6);
            if (weeklyDays.length === 0) {
                alert('Please specify valid days for weekly frequency (e.g., 1,3,5 for Mon,Wed,Fri).');
                return;
            }
            frequency = { type: 'weekly', days: weeklyDays };
            break;
        case 'specific_days':
            const specificDays = newHabitFrequencyDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 0 && d <=6);
             if (specificDays.length === 0) {
                alert('Please specify valid days for specific_days frequency (e.g., 1,3,5 for Mon,Wed,Fri).');
                return;
            }
            frequency = { type: 'specific_days', days: specificDays };
            break;
        // Basic monthly handling - day of month. Interval not supported in this form.
        case 'monthly':
            const dayOfMonth = parseInt(newHabitFrequencyDays);
            if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
                alert('Please specify a valid day of the month (1-31) for monthly frequency.');
                return;
            }
            frequency = { type: 'monthly', days: [dayOfMonth]};
            break;
        default:
            alert('Invalid frequency type.');
            return;
    }
    
    HabitTracker.addHabit(
        newHabitName,
        newHabitDescription || undefined,
        frequency,
        newHabitTarget || undefined,
        newHabitTargetUnit || undefined
    );
    
    // Reset form and reload habits
    newHabitName = '';
    newHabitDescription = '';
    newHabitFrequencyType = 'daily';
    newHabitFrequencyDays = '';
    newHabitTarget = undefined;
    newHabitTargetUnit = '';
    showAddHabitForm = false;
    loadHabits();
  }

  async function handleMarkComplete(habitId: string) {
    HabitTracker.markHabitComplete(habitId, new Date());
    loadHabits(); // Refresh the list to show updated streak/lastCompletedDate
  }

  function getFrequencyDisplay(freq: HabitFrequency): string {
    let display = freq.type;
    if (freq.days && (freq.type === 'specific_days' || freq.type === 'weekly')) {
      display += ` (Days: ${freq.days.join(', ')})`;
    } else if (freq.days && freq.type === 'monthly') {
      display += ` (Day: ${freq.days[0]})`;
    }
    if (freq.interval && freq.interval > 1) {
      display += ` every ${freq.interval}`;
    }
    return display;
  }
  
  onMount(() => {
    loadHabits();
  });

</script>

<div class="habit-tracker-view">
  <h2>Habit Tracker</h2>

  <button on:click={() => showAddHabitForm = !showAddHabitForm}>
    {#if showAddHabitForm}Hide Form{:else}Add New Habit{/if}
  </button>

  {#if showAddHabitForm}
    <div class="add-habit-form">
      <h3>Add New Habit</h3>
      <div>
        <label for="habit-name">Name:</label>
        <input type="text" id="habit-name" bind:value={newHabitName} required />
      </div>
      <div>
        <label for="habit-desc">Description (Optional):</label>
        <input type="text" id="habit-desc" bind:value={newHabitDescription} />
      </div>
      <div>
        <label for="habit-freq-type">Frequency Type:</label>
        <select id="habit-freq-type" bind:value={newHabitFrequencyType}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly (specific days)</option>
          <option value="specific_days">Specific Days of Week</option>
          <option value="monthly">Monthly (specific day)</option>
        </select>
      </div>
      {#if newHabitFrequencyType === 'weekly' || newHabitFrequencyType === 'specific_days'}
      <div>
        <label for="habit-freq-days">Days (0-6, comma-separated, e.g., 1,3,5 for Mon,Wed,Fri):</label>
        <input type="text" id="habit-freq-days" bind:value={newHabitFrequencyDays} />
      </div>
      {/if}
      {#if newHabitFrequencyType === 'monthly'}
      <div>
        <label for="habit-freq-day-month">Day of Month (1-31):</label>
        <input type="number" id="habit-freq-day-month" bind:value={newHabitFrequencyDays} min="1" max="31" />
      </div>
      {/if}
       <div>
        <label for="habit-target">Target (Optional, e.g., 5 for 5km):</label>
        <input type="number" id="habit-target" bind:value={newHabitTarget} />
      </div>
      <div>
        <label for="habit-target-unit">Target Unit (Optional, e.g., km, reps):</label>
        <input type="text" id="habit-target-unit" bind:value={newHabitTargetUnit} />
      </div>
      <button on:click={handleAddHabit}>Save Habit</button>
    </div>
  {/if}

  <div class="habit-list">
    <h3>Your Habits</h3>
    {#if habits.length === 0}
      <p>No habits yet. Add one to get started!</p>
    {:else}
      <ul>
        {#each habits as habit (habit.id)}
          <li>
            <div class="habit-info">
              <strong>{habit.name}</strong>
              {#if habit.description}<p class="description">{habit.description}</p>{/if}
              <p class="frequency">Frequency: {getFrequencyDisplay(habit.frequency)}</p>
              <p class="streak">Streak: {habit.streak}</p>
              <p class="last-completed">Last completed: {habit.lastCompletedDate || 'Never'}</p>
               {#if habit.target}
                <p class="target">Target: {habit.target} {habit.targetUnit || ''}</p>
               {/if}
            </div>
            <button class="complete-btn" on:click={() => handleMarkComplete(habit.id)} 
                    disabled={habit.lastCompletedDate === new Date().toISOString().split('T')[0]}>
              Mark Complete Today
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .habit-tracker-view {
    padding: 15px;
    font-family: sans-serif;
  }
  .add-habit-form {
    margin-top: 15px;
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  .add-habit-form div {
    margin-bottom: 10px;
  }
  .add-habit-form label {
    display: block;
    margin-bottom: 5px;
  }
  .add-habit-form input[type="text"],
  .add-habit-form input[type="number"],
  .add-habit-form select {
    width: 95%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 3px;
  }
  .habit-list ul {
    list-style: none;
    padding: 0;
  }
  .habit-list li {
    background-color: #f9f9f9;
    border: 1px solid #eee;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .habit-info .description {
    font-size: 0.9em;
    color: #555;
  }
  .habit-info .frequency, .habit-info .streak, .habit-info .last-completed, .habit-info .target {
    font-size: 0.85em;
    color: #333;
    margin: 3px 0;
  }
  .complete-btn {
    padding: 8px 12px;
    background-color: #5cb85c;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  .complete-btn:hover {
    background-color: #4cae4c;
  }
  .complete-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
</style>
