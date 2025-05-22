// src/modules/projects-tasks/ProjectService.ts
import { Project, ProjectStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for projects
let projects: Project[] = [];

/**
 * Creates a new project.
 * @param data - Object containing project details (name, description, status, dueDate).
 * @returns The newly created Project object.
 */
export function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const now = new Date().toISOString();
    const newProject: Project = {
        id: uuidv4(),
        ...data,
        createdAt: now,
        updatedAt: now,
    };
    projects.push(newProject);
    return newProject;
}

/**
 * Retrieves a project by its ID.
 * @param id - The ID of the project to retrieve.
 * @returns The Project object if found, otherwise undefined.
 */
export function getProject(id: string): Project | undefined {
    return projects.find(p => p.id === id);
}

/**
 * Updates an existing project.
 * @param id - The ID of the project to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated Project object if found, otherwise undefined.
 */
export function updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
): Project | undefined {
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
        return undefined;
    }
    const originalProject = projects[projectIndex];
    projects[projectIndex] = {
        ...originalProject,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    return projects[projectIndex];
}

/**
 * Deletes a project by its ID.
 * Also consider what to do with tasks associated with this project (orphaned or deleted).
 * For this phase, tasks will be orphaned.
 * @param id - The ID of the project to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export function deleteProject(id: string): boolean {
    const initialLength = projects.length;
    projects = projects.filter(p => p.id !== id);
    // TODO: Consider cascading delete or disassociation for tasks in TaskService
    return projects.length < initialLength;
}

/**
 * Retrieves all projects, optionally sorted by a specific key.
 * @param sortBy - Optional key of Project to sort by (e.g., 'name', 'dueDate', 'createdAt'). Default sort is by createdAt descending.
 * @returns An array of all Project objects.
 */
export function getAllProjects(sortBy?: keyof Project): Project[] {
    let sortedProjects = [...projects];
    if (sortBy) {
        sortedProjects.sort((a, b) => {
            if (a[sortBy]! < b[sortBy]!) return -1;
            if (a[sortBy]! > b[sortBy]!) return 1;
            return 0;
        });
    } else {
        // Default sort: createdAt, newest first
        sortedProjects.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sortedProjects;
}

/**
 * Retrieves projects filtered by status.
 * @param status - The ProjectStatus to filter by.
 * @returns An array of Project objects matching the status.
 */
export function getProjectsByStatus(status: ProjectStatus): Project[] {
    return projects.filter(p => p.status === status);
}

// Note: getTasksForProject will be conceptually part of ProjectService
// but its implementation might rely on TaskService or be implemented there
// for better separation of concerns. For now, we acknowledge it here.
/**
 * Placeholder/Conceptual: Retrieves all tasks associated with a specific project.
 * Actual implementation would typically be in TaskService or use it.
 * @param projectId - The ID of the project.
 * @returns An array of Task objects (conceptual).
 */
// export function getTasksForProject(projectId: string): Task[] {
//    // import { getTasksByProjectId } from './TaskService'; // Example
//    // return getTasksByProjectId(projectId);
//    console.warn("ProjectService.getTasksForProject is conceptual and not implemented yet.");
//    return [];
// }


// Helper function to reset the in-memory store, useful for testing
export function _resetProjectsStore(): void {
    projects = [];
}

// Example Usage (for internal testing)
/*
_resetProjectsStore();
const project1 = createProject({ name: "Website Redesign", status: ProjectStatus.ACTIVE, description: "Revamp company website." });
const project2 = createProject({ name: "Mobile App Development", status: ProjectStatus.NOT_STARTED, dueDate: "2024-12-31" });
console.log("All Projects:", getAllProjects());
updateProject(project1.id, { status: ProjectStatus.ON_HOLD, description: "Revamp company website - currently on hold." });
console.log("Project 1 Updated:", getProject(project1.id));
console.log("Active Projects:", getProjectsByStatus(ProjectStatus.ACTIVE)); // Should be empty now for project1
console.log("On Hold Projects:", getProjectsByStatus(ProjectStatus.ON_HOLD));
*/
