// src/modules/projects-tasks/DeadlineRisk.ts
import type { Task, Project, TaskStatus } from './types';
import { ProjectStatus } from './types'; // Ensure ProjectStatus is imported if not already

export interface DeadlineRiskAssessment {
    itemId: string; // Project ID or Task ID
    itemName: string;
    itemType: 'Project' | 'Task';
    dueDate?: string;
    riskLevel: 'High' | 'Medium' | 'Low' | 'None';
    reason: string;
}

/**
 * Assesses the risk of projects or tasks missing their deadlines.
 * This is a conceptual placeholder. A real implementation would involve
 * analyzing task progress, remaining work, dependencies, and due dates.
 * 
 * @param tasks - An array of all relevant Task objects.
 * @param projects - An array of all relevant Project objects.
 * @returns An array of DeadlineRiskAssessment objects for items at risk.
 */
export function calculateDeadlineRisk(tasks: Task[], projects: Project[]): DeadlineRiskAssessment[] {
    console.log('Calculating deadline risks (conceptual)');
    const risks: DeadlineRiskAssessment[] = [];
    const today = new Date();

    projects.forEach(project => {
        if (project.dueDate && project.status !== ProjectStatus.COMPLETED && project.status !== ProjectStatus.ARCHIVED) {
            const dueDate = new Date(project.dueDate);
            const daysRemaining = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
            if (daysRemaining < 0) {
                risks.push({ itemId: project.id, itemName: project.name, itemType: 'Project', dueDate: project.dueDate, riskLevel: 'High', reason: 'Project is overdue.' });
            } else if (daysRemaining < 7) {
                risks.push({ itemId: project.id, itemName: project.name, itemType: 'Project', dueDate: project.dueDate, riskLevel: 'Medium', reason: 'Project due within a week.' });
            }
        }
    });
    
    tasks.forEach(task => {
        if (task.dueDate && task.status !== TaskStatus.DONE && task.status !== TaskStatus.CANCELLED) {
            const dueDate = new Date(task.dueDate);
             const daysRemaining = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
             if (daysRemaining < 0) {
                risks.push({ itemId: task.id, itemName: task.name, itemType: 'Task', dueDate: task.dueDate, riskLevel: 'High', reason: 'Task is overdue.' });
            } else if (daysRemaining < 3) {
                risks.push({ itemId: task.id, itemName: task.name, itemType: 'Task', dueDate: task.dueDate, riskLevel: 'Medium', reason: 'Task due within 3 days.' });
            }
        }
    });

    return risks;
}
