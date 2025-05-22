<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import * as MoodService from '../MoodService';
  import type { Mood, MoodLog } from '../types';

  const dispatch = createEventDispatcher();

  let availableMoods: Mood[] = [];
  let recentMoodLogs: MoodLog[] = [];

  // Form fields for new mood log
  let selectedMoodId: string | undefined = undefined;
  let moodIntensity: number | undefined = undefined; // e.g., 1-5
  let moodNotes: string = '';

  let showAddMoodForm = true; // Default to show form

  async function loadMoodData() {
    availableMoods = MoodService.getAllMoodDefinitions();
    if (availableMoods.length > 0 && !selectedMoodId) {
        // Pre-select the first available mood or a common one like "Neutral" or "Calm" if exists
        const defaultMood = availableMoods.find(m => m.name.toLowerCase() === 'calm') || availableMoods[0];
        selectedMoodId = defaultMood.id;
    }
    // Load last 10-20 mood logs for display
    recentMoodLogs = MoodService.getMoodLogs({}).slice(0, 20); // getMoodLogs sorts by newest first
  }

  async function handleLogMood() {
    if (!selectedMoodId) {
      alert('Please select a mood.');
      return;
    }

    const loggedMood = MoodService.logMood(selectedMoodId, moodIntensity, moodNotes);

    if (loggedMood) {
      alert('Mood logged successfully!');
      // Reset form
      // selectedMoodId = availableMoods.length > 0 ? availableMoods[0].id : undefined; // Keep selected or reset
      moodIntensity = undefined;
      moodNotes = '';
      // Refresh recent logs
      loadMoodData();
      dispatch('moodLogged', loggedMood);
    } else {
      alert('Failed to log mood.');
    }
  }
  
  function getMoodNameAndColor(moodId: string): { name: string; color?: string } {
      const mood = MoodService.getMoodDefinition(moodId);
      return { name: mood?.name || 'Unknown Mood', color: mood?.color };
  }

  function formatDate(isoString: string): string {
      const date = new Date(isoString);
      return date.toLocaleString(); // Adjust formatting as needed
  }


  onMount(() => {
    loadMoodData();
  });

</script>

<div class="mood-log-view">
  <h3>Mood Log</h3>

  {#if showAddMoodForm}
    <div class="add-mood-form">
      <h4>Log Your Current Mood</h4>
      <div class="form-group">
        <label for="mood-select">How are you feeling?</label>
        <select id="mood-select" bind:value={selectedMoodId}>
          <option value={undefined}>-- Select a Mood --</option>
          {#each availableMoods as mood (mood.id)}
            <option value={mood.id}>{mood.name}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="mood-intensity">Intensity (1-5, Optional):</label>
        <input type="number" id="mood-intensity" bind:value={moodIntensity} min="1" max="5" placeholder="e.g., 3" />
      </div>

      <div class="form-group">
        <label for="mood-notes">Notes (Optional):</label>
        <textarea id="mood-notes" bind:value={moodNotes} rows="3" placeholder="Any specific thoughts or reasons?"></textarea>
      </div>
      <button class="log-btn" on:click={handleLogMood}>Log Mood</button>
    </div>
  {/if}
  <button class="toggle-form-btn" on:click={() => showAddMoodForm = !showAddMoodForm}>
    {#if showAddMoodForm}Hide Form{:else}Show Mood Logging Form{/if}
  </button>


  <div class="recent-moods">
    <h4>Recent Moods</h4>
    {#if recentMoodLogs.length === 0}
      <p>No moods logged yet.</p>
    {:else}
      <ul>
        {#each recentMoodLogs as log (log.id)}
          {@const moodInfo = getMoodNameAndColor(log.moodId)}
          <li style="border-left-color: {moodInfo.color || '#ccc'};">
            <div class="mood-log-entry">
              <strong style="color: {moodInfo.color || 'inherit'};">{moodInfo.name}</strong>
              {#if log.intensity}<span>(Intensity: {log.intensity}/5)</span>{/if}
              <p class="notes">{log.notes || 'No specific notes.'}</p>
              <small class="date">{formatDate(log.date)}</small>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .mood-log-view {
    padding: 15px;
    font-family: sans-serif;
  }
  .add-mood-form {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background-color: #f9f9f9;
  }
  .form-group {
    margin-bottom: 10px;
  }
  .form-group label {
    display: block;
    margin-bottom: 5px;
  }
  input[type="number"],
  textarea,
  select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  }
  textarea {
    min-height: 60px;
  }
  .log-btn, .toggle-form-btn {
    padding: 10px 15px;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 5px;
  }
  .log-btn {
    background-color: #28a745; /* Green */
  }
  .log-btn:hover {
    background-color: #218838;
  }
  .toggle-form-btn {
    background-color: #6c757d; /* Grey */
    margin-bottom: 15px;
  }

  .recent-moods h4 {
    margin-top: 20px;
  }
  .recent-moods ul {
    list-style: none;
    padding: 0;
  }
  .recent-moods li {
    background-color: #fff;
    border: 1px solid #eee;
    border-left-width: 5px; /* For mood color */
    padding: 10px 15px;
    margin-bottom: 8px;
    border-radius: 4px;
  }
  .mood-log-entry .notes {
    font-size: 0.9em;
    color: #555;
    margin: 5px 0;
  }
  .mood-log-entry .date {
    font-size: 0.8em;
    color: #777;
  }
</style>
