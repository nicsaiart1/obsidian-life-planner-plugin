<script lang="ts">
  // Placeholder for Eisenhower Matrix Svelte component
  export let urgentImportantTasks: string[] = []; // Added type annotation
  export let notUrgentImportantTasks: string[] = []; // Added type annotation
</script>

<div>
  <h3>Eisenhower Matrix</h3>
  <p>Matrix UI will be implemented here.</p>
  <!-- Basic structure example -->
  <div class="matrix-grid">
    <div class="quadrant">Urgent/Important</div>
    <div class="quadrant">Not Urgent/Important</div>
    <div class="quadrant">Urgent/Not Important</div>
    <div class="quadrant">Not Urgent/Not Important</div>
  </div>
</div>

<style>
  .matrix-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .quadrant {
    border: 1px solid #eee;
    padding: 10px;
    min-height: 50px;
  }
</style>
