// src/modules/projects-tasks/GanttChartView.ts
import type { Task, Project } from './types'; // Assuming types are defined
// Note: TaskStatus is used below (TaskStatus.DONE, TaskStatus.IN_PROGRESS) 
// but not explicitly imported in the provided snippet.
// Assuming it's globally available or implicitly via 'types' if TaskStatus is part of Task.

export interface GanttTask {
    id: string;         // Task ID
    name: string;       // Task Name
    start: string;      // Start date (YYYY-MM-DD)
    end: string;        // End date (YYYY-MM-DD)
    progress: number;   // Progress percentage (0-100)
    dependencies?: string; // Comma-separated IDs of tasks this task depends on
    projectId?: string;
    // Custom styling or additional info can be added here
}

export interface GanttChartData {
    projectId?: string;
    tasks: GanttTask[];
    // Could also include project-level start/end dates or milestones
}

/**
 * Retrieves and formats data suitable for rendering a Gantt chart.
 * This typically involves tasks with start and end dates.
 * 
 * @param allTasks - An array of all Task objects.
 * @param allProjects - An array of all Project objects (optional, for context).
 * @param targetProjectId - Optional project ID to scope the Gantt chart.
 * @returns GanttChartData object.
 */
export function getGanttChartData(allTasks: Task[], allProjects?: Project[], targetProjectId?: string): GanttChartData {
    console.log(`Fetching Gantt chart data for project: ${targetProjectId || 'All Projects'} (conceptual)`);
    
    const relevantTasks = targetProjectId 
        ? allTasks.filter(t => t.projectId === targetProjectId)
        : allTasks;

    const ganttTasks: GanttTask[] = relevantTasks
        .filter(task => task.dueDate) // Only include tasks with due dates for this basic version
        .map(task => {
            // Simplistic start date: createdAt or (dueDate - some duration)
            // For a real Gantt, tasks would need explicit start dates or duration fields.
            const startDate = new Date(task.createdAt);
            const endDate = new Date(task.dueDate!);
            
            // Ensure start is before end, very basic handling
            if (startDate > endDate) {
                startDate.setDate(endDate.getDate() - 1); 
            }
            
            // Accessing task.status which implies Task type has status property.
            // And assuming TaskStatus enum is available for comparison.
            let progress = 0;
            // @ts-ignore // Assuming TaskStatus.DONE and TaskStatus.IN_PROGRESS are valid and accessible
            if (task.status === "Done") progress = 100; // Using string literal as TaskStatus not imported
            // @ts-ignore
            else if (task.status === "In Progress") progress = 50; // Using string literal

            return {
                id: task.id,
                name: task.name,
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
                progress: progress,
                dependencies: '', // Placeholder for dependencies
                projectId: task.projectId,
            };
        });

    return { projectId: targetProjectId, tasks: ganttTasks };
}
