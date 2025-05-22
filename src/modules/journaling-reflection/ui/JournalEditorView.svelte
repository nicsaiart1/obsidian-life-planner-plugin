<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import * as JournalingService from '../JournalingService';
  import * as PromptBank from '../PromptBank';
  import * as MoodService from '../MoodService';
  import type { JournalEntry, Prompt, Mood } from '../types';

  const dispatch = createEventDispatcher();

  // Component props
  export let journalEntryId: string | null = null; // If provided, load this entry for editing

  // Local state
  let currentEntry: Partial<JournalEntry> = { title: '', content: '' };
  let availablePrompts: Prompt[] = [];
  let currentPrompt: Prompt | null = null;
  let availableMoods: Mood[] = [];
  let selectedMoodId: string | undefined = undefined;

  let editorContent = '';
  let editorTitle = '';

  function initializeNewEntry() {
    currentEntry = { title: '', content: '' };
    editorTitle = '';
    editorContent = '';
    selectedMoodId = undefined;
    // Optionally fetch a new random prompt for new entries
    fetchRandomPrompt();
  }

  async function loadJournalEntry(id: string) {
    const entry = JournalingService.getJournalEntry(id);
    if (entry) {
      currentEntry = { ...entry };
      editorTitle = entry.title || '';
      editorContent = entry.content;
      selectedMoodId = entry.moodLogId ? MoodService.getMoodLog(entry.moodLogId)?.moodId : undefined; // This is a bit indirect, might simplify later
      if (entry.promptId) {
        currentPrompt = PromptBank.getPromptById(entry.promptId) || null;
      }
    } else {
      // Entry not found, switch to new entry mode
      alert(`Journal entry with ID ${id} not found. Switching to new entry mode.`);
      journalEntryId = null;
      initializeNewEntry();
    }
  }

  function fetchPrompts() {
    availablePrompts = PromptBank.getAllPrompts(); // Or some filtered list
  }

  function fetchRandomPrompt() {
    currentPrompt = PromptBank.getRandomPrompt(undefined, false) || PromptBank.getRandomPrompt(undefined, true); // Fallback to used prompts
    if (currentPrompt) {
        // Automatically apply prompt to content if editor is empty, or offer to apply
        if (!editorContent.trim()) {
            editorContent = `## ${currentPrompt.text}

`;
        }
    }
  }

  function fetchMoods() {
    availableMoods = MoodService.getAllMoodDefinitions();
  }

  async function handleSaveEntry() {
    if (!editorContent.trim()) {
      alert('Journal content cannot be empty.');
      return;
    }

    let moodLogIdToSave: string | undefined = undefined;
    if (selectedMoodId) {
        // For simplicity, we create a new mood log each time.
        // A more complex app might update an existing mood log or link more directly.
        const moodLog = MoodService.logMood(selectedMoodId);
        if (moodLog) {
            moodLogIdToSave = moodLog.id;
        } else {
            alert("Failed to log selected mood.");
        }
    }
    
    let savedEntry;
    if (currentEntry.id) { // Existing entry
      savedEntry = JournalingService.updateJournalEntry(currentEntry.id, {
        title: editorTitle,
        content: editorContent,
        promptId: currentPrompt?.id,
        moodLogId: moodLogIdToSave,
      });
    } else { // New entry
      savedEntry = JournalingService.createJournalEntry(
        editorContent,
        editorTitle,
        currentPrompt?.id,
        moodLogIdToSave
      );
      currentEntry.id = savedEntry.id; // Keep editing the same entry
      journalEntryId = savedEntry.id; // Update prop if it was null
    }

    if (savedEntry) {
      if (currentPrompt) {
        PromptBank.markPromptAsUsed(currentPrompt.id);
      }
      alert('Journal entry saved!');
      dispatch('entrySaved', savedEntry);
      // Optionally, clear form or navigate, depending on desired UX
      // initializeNewEntry(); // Clears form for a new entry
    } else {
      alert('Failed to save journal entry.');
    }
  }
  
  function handleNewRandomPrompt() {
      fetchRandomPrompt();
  }

  onMount(() => {
    fetchPrompts();
    fetchMoods();
    if (journalEntryId) {
      loadJournalEntry(journalEntryId);
    } else {
      initializeNewEntry();
    }
  });

</script>

<div class="journal-editor-view">
  <h3>Journal Editor</h3>

  <div class="form-group">
    <label for="journal-title">Title (Optional):</label>
    <input type="text" id="journal-title" bind:value={editorTitle} placeholder="Entry Title" />
  </div>

  {#if currentPrompt}
    <div class="current-prompt">
      <strong>Prompt:</strong> {currentPrompt.text}
      <button class="inline-btn" on:click={handleNewRandomPrompt} title="Get another random prompt">Next Prompt</button>
    </div>
  {:else}
    <button class="inline-btn" on:click={handleNewRandomPrompt}>Get a Random Prompt</button>
  {/if}
  
  <div class="form-group">
    <label for="journal-content">Content (Markdown):</label>
    <textarea id="journal-content" bind:value={editorContent} rows="15" placeholder="Start writing your thoughts..."></textarea>
  </div>

  <div class="form-group">
    <label for="journal-mood">Mood (Optional):</label>
    <select id="journal-mood" bind:value={selectedMoodId}>
      <option value={undefined}>-- Select a Mood --</option>
      {#each availableMoods as mood (mood.id)}
        <option value={mood.id}>{mood.name}</option>
      {/each}
    </select>
  </div>

  <button class="save-btn" on:click={handleSaveEntry}>Save Entry</button>
  {#if journalEntryId}
    <button class="new-entry-btn" on:click={() => { journalEntryId = null; initializeNewEntry(); }}>New Blank Entry</button>
  {/if}
</div>

<style>
  .journal-editor-view {
    padding: 15px;
    font-family: sans-serif;
  }
  .form-group {
    margin-bottom: 15px;
  }
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  input[type="text"],
  textarea,
  select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box; /* Important for width 100% */
  }
  textarea {
    min-height: 200px;
    font-family: monospace; /* Good for markdown */
  }
  .current-prompt {
    background-color: #f0f0f0;
    padding: 10px;
    margin-bottom: 15px;
    border-radius: 4px;
    font-style: italic;
  }
  .inline-btn {
    margin-left: 10px;
    padding: 3px 8px;
    font-size: 0.9em;
  }
  .save-btn, .new-entry-btn {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;
  }
  .save-btn:hover {
    background-color: #0056b3;
  }
   .new-entry-btn {
    background-color: #6c757d;
   }
  .new-entry-btn:hover {
    background-color: #545b62;
  }
</style>
