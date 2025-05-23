<script lang="ts">
  import { onMount, tick } from 'svelte';
  // Adjust paths as per actual service file names if they differ from conceptual renaming
  import * as SourceService from '../ReadingTracker'; // KnowledgeSourceService
  import * as InsightService from '../InsightPipeline'; // InsightService
  import type { KnowledgeSource, Insight, ContentType, ContentStatus } from '../types';
  import { ContentTypeARR, ContentStatusARR } from './constants'; // Will create this file

  // --- State Variables ---
  let sources: KnowledgeSource[] = [];
  let insights: Insight[] = [];

  let selectedSource: KnowledgeSource | null = null;
  let insightsForSelectedSource: Insight[] = [];

  // Filter & Sort State for Sources
  let sourceFilterType: ContentType | '' = '';
  let sourceFilterStatus: ContentStatus | '' = '';
  let sourceFilterTag: string = '';
  let sourceSortBy: keyof KnowledgeSource = 'addedAt';

  // Filter & Sort State for Insights
  let insightFilterTag: string = '';
  let insightSortBy: keyof Insight = 'createdAt';
  
  // View State
  let currentView: 'sources' | 'insights' = 'sources'; // For tabbed view or main focus

  // Form visibility & state
  let showSourceForm = false;
  let editingSource = false;
  let sourceForm: Partial<KnowledgeSource> = {};

  let showInsightForm = false;
  let editingInsight = false;
  let insightForm: Partial<Insight> & { sourceId?: string | null } = {};


  // --- Data Loading ---
  async function loadSources() {
    const filter: any = {};
    if (sourceFilterType) filter.contentType = sourceFilterType;
    if (sourceFilterStatus) filter.status = sourceFilterStatus;
    if (sourceFilterTag.trim()) filter.tag = sourceFilterTag.trim();
    sources = SourceService.getAllSources(filter, sourceSortBy);
  }

  async function loadInsights() {
    const filter: any = {};
    if (insightFilterTag.trim()) filter.tag = insightFilterTag.trim();
    // If a source is selected, primarily show its insights, otherwise all insights.
    if (selectedSource) {
        insightsForSelectedSource = InsightService.getInsightsForSource(selectedSource.id);
        // If 'insights' view is active and no source selected, show all insights based on general filter
        if (currentView === 'insights' && !selectedSource) {
             insights = InsightService.getAllInsights(filter, insightSortBy);
        } else if (currentView === 'insights' && selectedSource) {
            // When a source is selected, 'insights' array can mirror 'insightsForSelectedSource' or apply further filters
            insights = insightsForSelectedSource.filter(i => filter.tag ? i.tags?.includes(filter.tag) : true);
        } else {
            insights = []; // Clear general insights if source view is active and source is selected
        }

    } else {
      insightsForSelectedSource = [];
      insights = InsightService.getAllInsights(filter, insightSortBy);
    }
  }
  
  async function handleSelectSource(source: KnowledgeSource | null) {
      selectedSource = source;
      showSourceForm = false;
      showInsightForm = false;
      if (source) {
          await loadInsights(); // This will now populate insightsForSelectedSource
      } else {
          insightsForSelectedSource = [];
          await loadInsights(); // Reload all insights if no source is selected
      }
  }


  // --- Source Actions ---
  function openNewSourceForm() {
    editingSource = false;
    sourceForm = { title: '', contentType: ContentTypeARR[0], status: ContentStatusARR[0] };
    showSourceForm = true;
  }

  function openEditSourceForm(source: KnowledgeSource) {
    editingSource = true;
    sourceForm = { ...source };
    showSourceForm = true;
  }

  async function saveSource() {
    if (!sourceForm.title?.trim()) {
      alert('Source title is required.');
      return;
    }
    if (editingSource && sourceForm.id) {
      SourceService.updateSource(sourceForm.id, sourceForm);
    } else {
      SourceService.addSource(sourceForm as Omit<KnowledgeSource, 'id'|'addedAt'|'updatedAt'>);
    }
    await loadSources();
    if (selectedSource && selectedSource.id === sourceForm.id) { // Refresh selected source if it was edited
        selectedSource = SourceService.getSource(selectedSource.id) || null;
    }
    showSourceForm = false;
  }

  async function deleteSource(sourceId: string) {
    if (confirm('Are you sure you want to delete this source? Associated insights will be orphaned.')) {
      SourceService.deleteSource(sourceId);
      if (selectedSource?.id === sourceId) {
        handleSelectSource(null);
      }
      await loadSources();
      await loadInsights(); // Insights might change if their source was deleted
    }
  }

  // --- Insight Actions ---
  function openNewInsightForm() {
    editingInsight = false;
    insightForm = { text: '', sourceId: selectedSource?.id || null };
    showInsightForm = true;
  }

  function openEditInsightForm(insight: Insight) {
    editingInsight = true;
    insightForm = { ...insight };
    showInsightForm = true;
  }

  async function saveInsight() {
    if (!insightForm.text?.trim()) {
      alert('Insight text is required.');
      return;
    }
    if (editingInsight && insightForm.id) {
      InsightService.updateInsight(insightForm.id, insightForm as Omit<Insight, 'id'|'createdAt'|'updatedAt'>);
    } else {
      InsightService.addInsight(insightForm as Omit<Insight, 'id'|'createdAt'|'updatedAt'>);
    }
    await loadInsights(); // Reload all or filtered insights
    if (selectedSource && (insightForm.sourceId === selectedSource.id || (editingInsight && insightsForSelectedSource.find(i => i.id === insightForm.id)))) {
        // If the saved insight belongs to the currently selected source, refresh its specific list
        insightsForSelectedSource = InsightService.getInsightsForSource(selectedSource.id);
    }
    showInsightForm = false;
  }
  
  async function deleteInsight(insightId: string) {
      if (confirm('Are you sure you want to delete this insight?')) {
          InsightService.deleteInsight(insightId);
          await loadInsights();
          if (selectedSource) { // Refresh insights for selected source
            insightsForSelectedSource = InsightService.getInsightsForSource(selectedSource.id);
          }
      }
  }
  
  function formatDate(isoString?: string | null): string {
      if (!isoString) return 'N/A';
      return new Date(isoString).toLocaleDateString(); // Simpler date format
  }
  
  function switchView(view: 'sources' | 'insights') {
      currentView = view;
      if (view === 'insights' && !selectedSource) { // If switching to insights view without a selected source
          loadInsights(); // Load all insights
      }
  }

  // --- Lifecycle & Watchers ---
  onMount(async () => {
    await loadSources();
    await loadInsights(); // Load all insights initially or based on default selectedSource (if any)
  });

  // $: statements for reactive updates based on filter/sort changes
  $: if(sourceFilterType !== undefined || sourceFilterStatus !== undefined || sourceFilterTag !== undefined || sourceSortBy !== undefined) loadSources();
  $: if(insightFilterTag !== undefined || insightSortBy !== undefined) {
      if (currentView === 'insights' && !selectedSource) loadInsights(); // Only reload all insights if in insights view and no source is selected
  }


</script>

<div class="knowledge-management-view">
  <div class="view-switcher">
      <button class:active={currentView === 'sources'} on:click={() => switchView('sources')}>Knowledge Sources</button>
      <button class:active={currentView === 'insights'} on:click={() => switchView('insights')}>Insights</button>
  </div>

  {#if currentView === 'sources'}
  <!-- Knowledge Sources Panel -->
  <div class="panel sources-panel">
    <div class="panel-header">
      <h3>Knowledge Sources</h3>
      <button on:click={openNewSourceForm}>+ Add Source</button>
    </div>
    <div class="filters">
      <select bind:value={sourceFilterType} title="Filter by Type"><option value="">All Types</option>{#each ContentTypeARR as type}<option value={type}>{type}</option>{/each}</select>
      <select bind:value={sourceFilterStatus} title="Filter by Status"><option value="">All Statuses</option>{#each ContentStatusARR as status}<option value={status}>{status}</option>{/each}</select>
      <input type="text" placeholder="Filter by tag..." bind:value={sourceFilterTag} title="Filter by Tag"/>
      <!-- Sort By for Sources - simplified, could be a dropdown -->
    </div>
    <ul class="item-list">
      {#each sources as source (source.id)}
        <li class:selected={selectedSource?.id === source.id} on:click={() => handleSelectSource(source)}>
          <strong>{source.title}</strong> ({source.contentType}) - {source.status}
          <div class="item-actions">
            <button class="edit-btn" on:click|stopPropagation={() => openEditSourceForm(source)}>Edit</button>
            <button class="delete-btn" on:click|stopPropagation={() => deleteSource(source.id)}>Del</button>
          </div>
        </li>
      {:else}
        <li>No sources found. Add one to get started!</li>
      {/each}
    </ul>
  </div>
  {/if}


  {#if currentView === 'insights' || selectedSource}
  <!-- Insights Panel (Shown if 'insights' view is active OR a source is selected) -->
  <div class="panel insights-panel">
    <div class="panel-header">
      <h3>{#if selectedSource}Insights for: {selectedSource.title}{:else}All Insights{/if}</h3>
      <button on:click={openNewInsightForm} disabled={!selectedSource && currentView !== 'insights'}>+ Add Insight</button> 
      <!-- Disable Add Insight if no source selected AND not in general insights view -->
    </div>
     {#if currentView === 'insights' && !selectedSource} <!-- General Insight Filters -->
        <div class="filters">
            <input type="text" placeholder="Filter by tag..." bind:value={insightFilterTag} title="Filter by Tag"/>
            <!-- Sort By for Insights - simplified -->
        </div>
     {/if}
    <ul class="item-list">
      {@const displayInsights = selectedSource ? insightsForSelectedSource : insights}
      {#each displayInsights as insight (insight.id)}
        <li title={insight.text}>
          {insight.title || insight.text.substring(0, 100) + (insight.text.length > 100 ? '...' : '')}
          {#if insight.sourceId && !selectedSource}
            {@const src = SourceService.getSource(insight.sourceId)}
            <small class="source-link"> (Source: {src?.title || 'Unknown'})</small>
          {/if}
          <div class="item-actions">
            <button class="edit-btn" on:click|stopPropagation={() => openEditInsightForm(insight)}>Edit</button>
            <button class="delete-btn" on:click|stopPropagation={() => deleteInsight(insight.id)}>Del</button>
          </div>
        </li>
      {:else}
        <li>{#if selectedSource}No insights for this source yet.{:else}No insights found.{/if}</li>
      {/each}
    </ul>
  </div>
  {/if}


  <!-- Source Form Modal -->
  {#if showSourceForm}
  <div class="modal-overlay" on:click|self={() => showSourceForm = false}>
    <div class="modal-content source-form">
      <h4>{editingSource ? 'Edit Source' : 'New Knowledge Source'}</h4>
      <label>Title*: <input type="text" bind:value={sourceForm.title} /></label>
      <label>Content Type*:
        <select bind:value={sourceForm.contentType}>
          {#each ContentTypeARR as type}<option value={type}>{type}</option>{/each}
        </select>
      </label>
      <label>Author/Creator: <input type="text" bind:value={sourceForm.authorOrCreator} /></label>
      <label>Publication Year: <input type="number" bind:value={sourceForm.publicationYear} /></label>
      <label>Status*:
        <select bind:value={sourceForm.status}>
          {#each ContentStatusARR as status}<option value={status}>{status}</option>{/each}
        </select>
      </label>
      <label>Source URL: <input type="url" bind:value={sourceForm.sourceUrl} /></label>
      <label>File Path (Obsidian Note/Local File): <input type="text" bind:value={sourceForm.filePath} /></label>
      <label>Rating (1-5): <input type="number" min="1" max="5" bind:value={sourceForm.rating} /></label>
      <label>Summary: <textarea bind:value={sourceForm.summary} rows="3"></textarea></label>
      <label>Cover Image URL/Path: <input type="text" bind:value={sourceForm.coverImage} /></label>
      <label>Tags (comma-separated): <input type="text" bind:value={sourceForm.tags} on:input={(e) => sourceForm.tags = e.currentTarget.value.split(',').map(t => t.trim()).filter(t => t)} /></label>
      <div class="form-actions">
        <button on:click={saveSource}>Save Source</button>
        <button class="cancel-btn" on:click={() => showSourceForm = false}>Cancel</button>
      </div>
    </div>
  </div>
  {/if}

  <!-- Insight Form Modal -->
  {#if showInsightForm}
  <div class="modal-overlay" on:click|self={() => showInsightForm = false}>
    <div class="modal-content insight-form">
      <h4>{editingInsight ? 'Edit Insight' : 'New Insight'}</h4>
      {#if selectedSource && !editingInsight && !insightForm.sourceId} <p>For Source: {selectedSource.title}</p> {/if}
      <label>Link to Knowledge Source (Optional):
        <select bind:value={insightForm.sourceId}>
          <option value={null}>-- None --</option>
          {#each sources as source (source.id)}
            <option value={source.id}>{source.title}</option>
          {/each}
        </select>
      </label>
      <label>Title (Optional): <input type="text" bind:value={insightForm.title} /></label>
      <label>Insight Text (Markdown)*: <textarea bind:value={insightForm.text} rows="5"></textarea></label>
      <label>Context (e.g., page, chapter, timestamp): <input type="text" bind:value={insightForm.context} /></label>
      <label>Linked Obsidian Note Path: <input type="text" bind:value={insightForm.linkedNotePath} /></label>
      <!-- Related Insights - Future Enhancement (e.g., multi-select) -->
      <label>Tags (comma-separated): <input type="text" bind:value={insightForm.tags} on:input={(e) => insightForm.tags = e.currentTarget.value.split(',').map(t => t.trim()).filter(t => t)} /></label>
      <div class="form-actions">
        <button on:click={saveInsight}>Save Insight</button>
        <button class="cancel-btn" on:click={() => showInsightForm = false}>Cancel</button>
      </div>
    </div>
  </div>
  {/if}

</div>

<style>
  .knowledge-management-view { display: flex; flex-direction: column; height: calc(100vh - 50px); font-family: sans-serif; }
  .view-switcher { margin-bottom: 10px; }
  .view-switcher button { padding: 8px 12px; margin-right: 5px; border: 1px solid #ccc; background-color: #f0f0f0; cursor: pointer; }
  .view-switcher button.active { background-color: #007bff; color: white; border-color: #007bff; }
  
  .panels-container { display: flex; flex-grow: 1; overflow: hidden; } /* If using side-by-side panels */
  .panel { padding: 10px; border: 1px solid #ccc; overflow-y: auto; margin-bottom:10px; /* For stacked view */ }
  /* .sources-panel { width: 40%; margin-right: 10px; } /* For side-by-side */
  /* .insights-panel { width: 60%; } /* For side-by-side */

  .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .filters { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .filters select, .filters input { padding: 5px; border: 1px solid #ddd; border-radius: 3px; }
  
  .item-list { list-style: none; padding: 0; }
  .item-list li { padding: 8px; margin-bottom: 5px; border-radius: 3px; border: 1px solid #eee; cursor: pointer; }
  .item-list li:hover { background-color: #f5f5f5; }
  .item-list li.selected { background-color: #e0e8ff; border-left: 3px solid #007bff;}
  .item-actions { float: right; }
  .item-actions button { font-size: 0.8em; padding: 2px 5px; margin-left: 5px; }
  .edit-btn { background-color: #ffc107; border:none; border-radius:3px; }
  .delete-btn { background-color: #dc3545; color: white; border:none; border-radius:3px; }
  .cancel-btn { background-color: #6c757d; color: white; border:none; border-radius:3px; }
  small.source-link { font-size: 0.8em; color: #555; }

  .modal-overlay { /* Styles from previous components */ }
  .modal-content { /* Styles from previous components */ }
  .modal-content label, .modal-content input, .modal-content textarea, .modal-content select { /* ... */ }
  .form-actions { /* ... */ }
  /* Add styles from previous modal forms for consistency */
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
  .modal-content { background-color: white; padding: 20px; border-radius: 5px; min-width: 450px; max-width: 700px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-height: 80vh; overflow-y: auto;}
  .modal-content h4 { margin-top: 0; }
  .modal-content label { display: block; margin-bottom: 3px; font-weight: bold; font-size: 0.9em; }
  .modal-content input[type="text"],
  .modal-content input[type="number"],
  .modal-content input[type="url"],
  .modal-content input[type="date"],
  .modal-content textarea,
  .modal-content select {
    width: 100%; /* Full width */
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 3px;
    box-sizing: border-box;
  }
   .form-actions { margin-top: 15px; text-align: right; }
   .form-actions button { margin-left: 10px; padding: 8px 15px; }
</style>
