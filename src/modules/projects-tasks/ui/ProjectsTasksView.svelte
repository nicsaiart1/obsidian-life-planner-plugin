<script lang="ts">
  import { onMount, tick } from 'svelte';
  import * as ProjectService from '../ProjectService';
  import * as TaskService from '../TaskService';
  import type { Project, Task, ProjectStatus, TaskStatus, TaskPriority } from '../types';
  import { TaskPriorityARR, TaskStatusARR, ProjectStatusARR } from './constants'; // Will create this file next

  // State variables
  let projects: Project[] = [];
  let tasks: Task[] = [];
  let selectedProjectId: string | null = null; // null for "All Tasks"
  let currentProject: Project | null = null;
  let currentTask: Task | null = null;

  // Form visibility
  let showProjectForm = false;
  let showTaskForm = false;
  let editingProject = false;
  let editingTask = false;

  // Project form fields
  let projectForm: Partial<Project> = {};
  // Task form fields
  let taskForm: Partial<Task> & { projectId?: string | null } = {}; // Ensure projectId is part of taskForm type

  // --- Data Loading ---
  async function loadProjects() {
    projects = ProjectService.getAllProjects(); // Default sort (newest first)
  }

  async function loadTasks() {
    if (selectedProjectId) {
      tasks = TaskService.getTasksFiltered({ projectId: selectedProjectId });
      currentProject = ProjectService.getProject(selectedProjectId) || null;
    } else {
      tasks = TaskService.getAllTasks(); // Default sort (newest first)
      currentProject = null;
    }
  }

  // --- Project Actions ---
  function handleSelectProject(projectId: string | null) {
    selectedProjectId = projectId;
    loadTasks();
    showProjectForm = false; // Hide forms on selection change
    showTaskForm = false;
  }

  function openNewProjectForm() {
    editingProject = false;
    projectForm = { name: '', status: ProjectStatusARR[0] as ProjectStatus }; // Default status
    showProjectForm = true;
    showTaskForm = false;
  }

  function openEditProjectForm(project: Project) {
    editingProject = true;
    projectForm = { ...project };
    showProjectForm = true;
    showTaskForm = false;
  }

  function saveProject() {
    if (!projectForm.name?.trim()) {
      alert('Project name is required.');
      return;
    }
    if (editingProject && projectForm.id) {
      ProjectService.updateProject(projectForm.id, projectForm);
    } else {
      ProjectService.createProject(projectForm as Omit<Project, 'id'|'createdAt'|'updatedAt'>);
    }
    loadProjects();
    showProjectForm = false;
  }

  function handleDeleteProject(projectId: string) {
    if (confirm('Are you sure you want to delete this project and all its tasks?')) {
      // First delete tasks of the project
      const tasksOfProject = TaskService.getTasksFiltered({ projectId });
      tasksOfProject.forEach(task => TaskService.deleteTask(task.id));
      
      ProjectService.deleteProject(projectId);
      
      if (selectedProjectId === projectId) {
        handleSelectProject(null); // Go to "All Tasks"
      }
      loadProjects();
      loadTasks(); // Refresh tasks as some might have been deleted
    }
  }


  // --- Task Actions ---
  function openNewTaskForm() {
    editingTask = false;
    taskForm = { 
        name: '', 
        status: TaskStatusARR[0] as TaskStatus, 
        priority: TaskPriorityARR[1] as TaskPriority, // Default to Medium
        projectId: selectedProjectId // Associate with current project if one is selected
    };
    showTaskForm = true;
    showProjectForm = false;
  }

  function openEditTaskForm(task: Task) {
    editingTask = true;
    taskForm = { ...task };
    showTaskForm = true;
    showProjectForm = false;
  }

  async function saveTask() {
    if (!taskForm.name?.trim()) {
      alert('Task name is required.');
      return;
    }
    // Ensure projectId is correctly passed; it might be null for "All Tasks" view but tasks should ideally have a project
    // For this UI, if selectedProjectId is null when creating a task, it will be created without a projectId.
     if (!taskForm.projectId && selectedProjectId) { // If creating a new task under a selected project
        taskForm.projectId = selectedProjectId;
    }


    if (editingTask && taskForm.id) {
      TaskService.updateTask(taskForm.id, taskForm as Omit<Task, 'id'|'createdAt'|'updatedAt'|'completedAt'>);
    } else {
      TaskService.createTask(taskForm as Omit<Task, 'id'|'createdAt'|'updatedAt'|'completedAt'>);
    }
    await loadTasks(); // Use await if loadTasks becomes async due to service calls
    showTaskForm = false;
  }
  
  async function toggleTaskStatus(task: Task) {
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    TaskService.updateTask(task.id, { status: newStatus });
    await tick(); // Wait for Svelte to update the DOM if needed by other logic
    loadTasks(); // Reload tasks to reflect change
  }
  
  function handleDeleteTask(taskId: string) {
      if (confirm('Are you sure you want to delete this task?')) {
          TaskService.deleteTask(taskId);
          loadTasks();
      }
  }


  // --- Lifecycle ---
  onMount(async () => {
    // Create constants file for enums if it doesn't exist (developer action)
    // For the Svelte component, assume ProjectStatusARR etc. are available
    await loadProjects();
    await loadTasks(); // Load all tasks initially or tasks for first project
  });

</script>

<div class="projects-tasks-view">
  <!-- Left Panel: Projects -->
  <div class="panel projects-panel">
    <h3>Projects</h3>
    <button on:click={openNewProjectForm}>+ New Project</button>
    <ul>
      <li class:selected={selectedProjectId === null} on:click={() => handleSelectProject(null)}>
        All Tasks
      </li>
      {#each projects as project (project.id)}
        <li class:selected={selectedProjectId === project.id} on:click={() => handleSelectProject(project.id)}>
          {project.name} ({project.status})
          <div class="project-actions">
            <button class="edit-btn" on:click|stopPropagation={() => openEditProjectForm(project)}>Edit</button>
            <button class="delete-btn" on:click|stopPropagation={() => handleDeleteProject(project.id)}>Del</button>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <!-- Right Panel: Tasks -->
  <div class="panel tasks-panel">
    <h3>
      {#if currentProject}{currentProject.name} - Tasks{:else}All Tasks{/if}
    </h3>
    <button on:click={openNewTaskForm}>+ New Task</button>

    {#if tasks.length === 0}
      <p class="empty-state">No tasks here. Add one!</p>
    {/if}

    <ul>
      {#each tasks as task (task.id)}
        <li class="task-item {task.status.toLowerCase().replace(' ','-')} priority-{task.priority.toLowerCase()}">
          <div class="task-header">
            <input type="checkbox" checked={task.status === TaskStatus.DONE} on:change={() => toggleTaskStatus(task)} title="Mark Done/Todo"/>
            <span class="task-name">{task.name}</span>
          </div>
          <div class="task-details">
            {#if task.description}<p class="desc">Desc: {task.description}</p>{/if}
            <p>Status: {task.status} | Priority: {task.priority}</p>
            {#if task.dueDate}<p>Due: {task.dueDate}</p>{/if}
          </div>
          <div class="task-actions">
            <button class="edit-btn" on:click={() => openEditTaskForm(task)}>Edit</button>
            <button class="delete-btn" on:click={() => handleDeleteTask(task.id)}>Del</button>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <!-- Forms (Modals or Inline) -->
  {#if showProjectForm}
    <div class="modal-overlay" on:click|self={() => showProjectForm = false}>
      <div class="modal-content project-form">
        <h4>{editingProject ? 'Edit Project' : 'New Project'}</h4>
        <label>Name: <input type="text" bind:value={projectForm.name} /></label>
        <label>Description: <textarea bind:value={projectForm.description}></textarea></label>
        <label>Status:
          <select bind:value={projectForm.status}>
            {#each ProjectStatusARR as statusValue}
              <option value={statusValue}>{statusValue}</option>
            {/each}
          </select>
        </label>
        <label>Due Date: <input type="date" bind:value={projectForm.dueDate} /></label>
        <div class="form-actions">
            <button on:click={saveProject}>Save Project</button>
            <button class="cancel-btn" on:click={() => showProjectForm = false}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showTaskForm}
  <div class="modal-overlay" on:click|self={() => showTaskForm = false}>
    <div class="modal-content task-form">
        <h4>{editingTask ? 'Edit Task' : 'New Task'}</h4>
        {#if !editingTask && currentProject } <p>Project: {currentProject.name}</p> {/if}
        <!-- Allow changing project for existing tasks or if creating without a project selected -->
        {#if editingTask || (!editingTask && !selectedProjectId)}
        <label>Project:
            <select bind:value={taskForm.projectId}>
                <option value={null}>-- No Project --</option>
                {#each projects as p (p.id)}
                <option value={p.id}>{p.name}</option>
                {/each}
            </select>
        </label>
        {/if}

        <label>Name: <input type="text" bind:value={taskForm.name} /></label>
        <label>Description: <textarea bind:value={taskForm.description}></textarea></label>
        <label>Status:
          <select bind:value={taskForm.status}>
            {#each TaskStatusARR as statusValue}
              <option value={statusValue}>{statusValue}</option>
            {/each}
          </select>
        </label>
        <label>Priority:
          <select bind:value={taskForm.priority}>
            {#each TaskPriorityARR as priorityValue}
              <option value={priorityValue}>{priorityValue}</option>
            {/each}
          </select>
        </label>
        <label>Due Date: <input type="date" bind:value={taskForm.dueDate} /></label>
        <div class="form-actions">
            <button on:click={saveTask}>Save Task</button>
            <button class="cancel-btn" on:click={() => showTaskForm = false}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  .projects-tasks-view {
    display: flex;
    height: calc(100vh - 50px); /* Example height, adjust as needed */
    font-family: sans-serif;
  }
  .panel {
    padding: 10px;
    border: 1px solid #ccc;
    overflow-y: auto;
  }
  .projects-panel {
    width: 30%;
    min-width: 200px;
    margin-right: 10px;
  }
  .tasks-panel {
    width: 70%;
  }
  .projects-panel ul, .tasks-panel ul {
    list-style: none;
    padding: 0;
  }
  .projects-panel li {
    padding: 8px;
    margin-bottom: 5px;
    border-radius: 3px;
    cursor: pointer;
    border: 1px solid transparent;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .projects-panel li:hover {
    background-color: #f0f0f0;
  }
  .projects-panel li.selected {
    background-color: #e0e0ff;
    border-color: #c0c0ff;
  }
  .project-actions button, .task-actions button {
      font-size: 0.8em;
      padding: 2px 5px;
      margin-left: 5px;
  }
  .edit-btn { background-color: #ffc107; border:none; border-radius:3px; }
  .delete-btn { background-color: #dc3545; color: white; border:none; border-radius:3px; }
  .cancel-btn { background-color: #6c757d; color: white; border:none; border-radius:3px; }


  .task-item {
    background-color: #f9f9f9;
    border: 1px solid #eee;
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 4px;
  }
  .task-header { display: flex; align-items: center; margin-bottom: 5px; }
  .task-header input[type="checkbox"] { margin-right: 8px; }
  .task-name { font-weight: bold; }
  .task-details { font-size: 0.9em; color: #555; margin-bottom: 5px; }
  .task-details p { margin: 2px 0; }
  .task-item.priority-high .task-name { color: #d9534f; }
  .task-item.priority-medium .task-name { color: #f0ad4e; }
  .task-item.status-done .task-name { text-decoration: line-through; color: #777; }
  .empty-state { color: #777; text-align: center; margin-top: 20px; }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Ensure it's on top */
  }
  .modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    min-width: 300px;
    max-width: 500px;
  }
  .modal-content label { display: block; margin-bottom: 5px; }
  .modal-content input, .modal-content textarea, .modal-content select {
    width: 95%; /* Account for padding */
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 3px;
  }
   .form-actions { margin-top: 15px; text-align: right; }
   .form-actions button { margin-left: 10px; }
</style>
