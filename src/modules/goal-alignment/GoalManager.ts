// src/modules/goal-alignment/GoalManager.ts
import { App, TFile, normalizePath, Notice } from 'obsidian';

export interface Goal {
    id: string; // Usually the filePath or a unique part of it
    title: string;
    description?: string;
    type?: 'goal' | string; // To distinguish from other note types
    status?: 'todo' | 'inprogress' | 'done' | 'archived' | string;
    due_date?: string | null; // ISO Date "YYYY-MM-DD"
    parent_goal_id?: string | null;
    vision_id?: string | null;
    aligned_values?: string[];
    template_type?: "SMART" | string; // e.g., "SMART", "OKR", "WOOP"
    filePath: string; // Path to the note
    accountability_partner?: string; // Added
    // Add other fields as necessary
}

export interface KeyResult {
    kr_title: string;
    kr_status?: string;
    kr_target_value?: string | number;
    kr_current_value?: string | number;
    kr_type?: string;
}

export interface CreateGoalParams {
    title: string;
    description?: string;
    parentGoalId?: string;
    visionId?: string;
    // isSMART?: boolean; // Replaced by templateType
    templateType?: "SMART" | "OKR" | "WOOP" | string;
    alignedValues?: string[];
    dueDate?: string; // "YYYY-MM-DD"
    folder?: string; // Optional: folder to create goal in, defaults to "goals/"

    // OKR specific
    okrObjective?: string;
    okrKeyResults?: KeyResult[];

    // WOOP specific
    woopWish?: string;
    woopOutcome?: string;
    woopObstacle?: string;
    woopPlan?: string;

    accountability_partner?: string; // Added
}

export async function createGoal(app: App, params: CreateGoalParams): Promise<string | null> {
    try {
        const folder = params.folder || "goals/";
        const normalizedFolder = normalizePath(folder);

        // Ensure the folder exists
        if (!(await app.vault.adapter.exists(normalizedFolder))) {
            await app.vault.createFolder(normalizedFolder);
        }

        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const sanitizedTitle = params.title.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
        const fileName = `${timestamp}-${sanitizedTitle || 'untitled'}.md`;
        const filePath = normalizePath(`${normalizedFolder}/${fileName}`);

        // Build Frontmatter
        let fmParts = ['---'];
        fmParts.push(`id: ${JSON.stringify(filePath)}`); // Using filePath as ID for simplicity
        fmParts.push(`title: ${JSON.stringify(params.title)}`);
        fmParts.push(`type: goal`);
        fmParts.push(`status: todo`); // Default status

        if (params.description) {
            fmParts.push(`description: ${JSON.stringify(params.description)}`);
        }
        if (params.dueDate) {
            fmParts.push(`due_date: ${params.dueDate}`); // Dates are typically not quoted unless they contain special chars
        }
        if (params.parentGoalId) {
            fmParts.push(`parent_goal_id: ${JSON.stringify(params.parentGoalId)}`);
        }
        if (params.visionId) {
            fmParts.push(`vision_id: ${JSON.stringify(params.visionId)}`);
        }
        if (params.alignedValues && params.alignedValues.length > 0) {
            fmParts.push('aligned_values:');
            params.alignedValues.forEach(value => {
                fmParts.push(`  - ${JSON.stringify(value)}`);
            });
        }
        
        // Add template_type if provided
        if (params.templateType) {
            fmParts.push(`template_type: ${params.templateType}`);
        }

        // OKR specific frontmatter
        if (params.templateType === "OKR") {
            if (params.okrObjective) {
                fmParts.push(`objective: ${JSON.stringify(params.okrObjective)}`);
            }
            if (params.okrKeyResults && params.okrKeyResults.length > 0) {
                fmParts.push('key_results:');
                params.okrKeyResults.forEach(kr => {
                    fmParts.push(`  - kr_title: ${JSON.stringify(kr.kr_title)}`);
                    if (kr.kr_status) fmParts.push(`    kr_status: ${JSON.stringify(kr.kr_status)}`);
                    if (kr.kr_target_value !== undefined) fmParts.push(`    kr_target_value: ${typeof kr.kr_target_value === 'string' ? JSON.stringify(kr.kr_target_value) : kr.kr_target_value}`);
                    if (kr.kr_current_value !== undefined) fmParts.push(`    kr_current_value: ${typeof kr.kr_current_value === 'string' ? JSON.stringify(kr.kr_current_value) : kr.kr_current_value}`);
                    if (kr.kr_type) fmParts.push(`    kr_type: ${JSON.stringify(kr.kr_type)}`);
                });
            }
        }

        // WOOP specific frontmatter
        if (params.templateType === "WOOP") {
            if (params.woopWish) fmParts.push(`wish: ${JSON.stringify(params.woopWish)}`);
            if (params.woopOutcome) fmParts.push(`outcome: ${JSON.stringify(params.woopOutcome)}`);
            if (params.woopObstacle) fmParts.push(`obstacle: ${JSON.stringify(params.woopObstacle)}`);
            if (params.woopPlan) fmParts.push(`plan: ${JSON.stringify(params.woopPlan)}`);
        }

        // Add accountability_partner if provided
        if (params.accountability_partner) {
            fmParts.push(`accountability_partner: ${JSON.stringify(params.accountability_partner)}`);
        }

        fmParts.push('---');
        const yamlFrontmatter = fmParts.join('\n');

        // Generate Note Body
        let noteBody = ``; // Initialize empty, will be populated based on template
        
        if (params.templateType === "SMART") {
            noteBody = `\n# SMART Goal: ${params.title}\n
## Specific
> What exactly do I want to achieve?

- 

## Measurable
> How will I know when I’ve achieved it?

- 

## Achievable
> Is it in my power to accomplish it?

- 

## Relevant
> Is it worthwhile and will it meet my needs/goals?

- 

## Time-bound
> What is the deadline and are there milestones?

- 

## Milestones/Tasks
- [ ] Milestone 1
- [ ] Milestone 2
`;
        } else if (params.templateType === "OKR") {
            noteBody = `\n# OKR Goal: ${params.title}\n
## Objective
${params.okrObjective || "_Define your objective here._"}

## Key Results
${params.okrKeyResults && params.okrKeyResults.length > 0 ? 
  params.okrKeyResults.map(kr => `- [ ] **${kr.kr_title}** ${kr.kr_status ? '('+kr.kr_status+')' : ''}`).join('\n') : 
`- [ ] Key Result 1
- [ ] Key Result 2`}

## Other Details/Tasks
- [ ] 
`;
        } else if (params.templateType === "WOOP") {
            noteBody = `\n# WOOP Goal: ${params.title}\n
## Wish
> ${params.woopWish || "_What is your heartfelt wish?_"}

## Outcome
> ${params.woopOutcome || "_What is the best possible outcome if you achieve your wish?_"}

## Obstacle
> ${params.woopObstacle || "_What is the main internal obstacle holding you back?_"}

## Plan
> If **[Obstacle: ${params.woopObstacle || "_obstacle_"}]**, then I will **[Plan: ${params.woopPlan || "_my plan_"}]**.

## Tasks/Next Steps
- [ ] 
`;
        } else { // Generic/No specific template or description provided for body
            noteBody = `\n# ${params.title}\n\n`;
            if (params.description) {
                noteBody += `${params.description}\n\n`;
            }
            noteBody += `## Tasks\n- [ ] \n`;
        }

        const fileContent = `${yamlFrontmatter}\n${noteBody.trimStart()}`;

        // Create the Note
        const newFile = await app.vault.create(filePath, fileContent);
        new Notice(`Goal created: ${newFile.basename}`);
        return newFile.path;

    } catch (error) {
        console.error("Error creating goal:", error);
        new Notice("Error creating goal: " + error.message);
        return null;
    }
}

export function getGoalProgressFromContent(content: string): { total: number; completed: number; percentage: number } {
    // Regex to match lines starting with optional whitespace, then -, *, or +, then whitespace, then [ ], [x], or [X], then whitespace, then any characters.
    const totalTasksRegex = /^(?:\s*(?:-|\*|\+)\s+\[[ xX]\]\s+.*)/gm; 
    const completedTasksRegex = /^(?:\s*(?:-|\*|\+)\s+\[[xX]\]\s+.*)/gm;

    const totalMatches = content.match(totalTasksRegex);
    const completedMatches = content.match(completedTasksRegex);

    const total = totalMatches ? totalMatches.length : 0;
    const completed = completedMatches ? completedMatches.length : 0;

    let percentage = 0;
    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }

    return { total, completed, percentage };
}

export async function getGoalProgress(app: App, goalFile: TFile): Promise<{ total: number; completed: number; percentage: number }> {
    try {
        const content = await app.vault.cachedRead(goalFile);
        return getGoalProgressFromContent(content);
    } catch (error) {
        console.error(`Error reading goal file (${goalFile.path}) for progress:`, error);
        return { total: 0, completed: 0, percentage: 0 }; // Return zero progress on error
    }
}

export async function generateBurndownSnapshotString(app: App, goalFile: TFile): Promise<string> {
    try {
        const progress = await getGoalProgress(app, goalFile);
        
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        return `${dateString}: ${progress.completed}/${progress.total} tasks completed (${progress.percentage}%).`;
    } catch (error) {
        console.error(`Error generating burndown snapshot for ${goalFile.path}:`, error);
        return "Error generating progress snapshot."; // Or re-throw if preferred
    }
}

// --- Goal Hierarchy Logic ---

export async function getAllGoals(app: App): Promise<Goal[]> {
    const files: TFile[] = app.vault.getMarkdownFiles();
    const goals: Goal[] = [];
    const validGoalTypes = ['goal', 'vision', 'milestone']; // Define types that are part of the hierarchy

    for (const file of files) {
        const fileCache = app.metadataCache.getFileCache(file);
        const fm = fileCache?.frontmatter;

        if (fm && fm.type && validGoalTypes.includes(fm.type as string)) {
            // Ensure 'id' is present, using filePath if 'id' from frontmatter is missing
            const id = fm.id || file.path; 
            
            const goal: Goal = {
                id: id,
                title: fm.title || file.basename,
                description: fm.description,
                type: fm.type as string,
                status: fm.status,
                due_date: fm.due_date,
                parent_goal_id: fm.parent_goal_id,
                vision_id: fm.vision_id,
                aligned_values: fm.aligned_values,
                template_type: fm.template_type,
                filePath: file.path,
            };
            goals.push(goal);
        }
    }
    return goals;
}

function buildNodeText(goal: Goal, allGoals: Goal[], indentLevel: number): string {
    let output = "\t".repeat(indentLevel) + "- " + goal.title + 
                 (goal.status ? ` (${goal.status})` : "") + 
                 (goal.type ? ` [${goal.type}]` : "") + 
                 ` [[${goal.filePath}]]` + "\n";

    // Find children:
    // 1. Goals/Milestones whose parent_goal_id matches the current goal's id
    // 2. Goals whose vision_id matches the current goal's id (if current goal is a vision)
    const children = allGoals.filter(child => {
        if (goal.type === 'vision') {
            return child.vision_id === goal.id;
        }
        return child.parent_goal_id === goal.id;
    });

    for (const child of children) {
        // Prevent infinite recursion if a goal is its own parent (should not happen with good data)
        if (child.id === goal.id) continue; 
        output += buildNodeText(child, allGoals, indentLevel + 1);
    }
    return output;
}

export async function buildGoalHierarchyText(app: App, rootIdOrTitle?: string): Promise<string> {
    const allGoals = await getAllGoals(app);
    if (allGoals.length === 0) {
        return "No goals, visions, or milestones found in the vault.";
    }

    let rootNodes: Goal[] = [];
    let output = "";

    if (rootIdOrTitle) {
        const foundRoot = allGoals.find(g => g.id === rootIdOrTitle || g.title === rootIdOrTitle);
        if (foundRoot) {
            rootNodes.push(foundRoot);
        } else {
            return `Could not find the specified root vision/goal: ${rootIdOrTitle}`;
        }
    } else {
        // Default root nodes:
        // 1. Visions (they are top-level by nature)
        // 2. Goals/Milestones that do not have a parent_goal_id AND do not have a vision_id
        //    (or their vision_id points to a vision that doesn't exist, or themselves - though self-reference is less common for vision_id)
        rootNodes = allGoals.filter(g => {
            if (g.type === 'vision') return true;
            // Check if this goal/milestone is parented by any other goal/milestone in the list
            const isParentedByGoal = allGoals.some(parentCandidate => parentCandidate.id === g.parent_goal_id && parentCandidate.id !== g.id);
            // Check if this goal/milestone is linked to an existing vision
            const isLinkedToExistingVision = g.vision_id ? allGoals.some(visionCandidate => visionCandidate.id === g.vision_id && visionCandidate.type === 'vision') : false;
            
            return !isParentedByGoal && !isLinkedToExistingVision;
        });
    }
    
    if (rootNodes.length === 0) {
        if (!rootIdOrTitle) return "No top-level visions or unparented goals found.";
        // If rootIdOrTitle was provided but led to no roots (e.g. it's a child itself), this case might be hit.
        // However, the earlier check for `foundRoot` should handle direct misses of `rootIdOrTitle`.
        // This means the specified root has no children or is not processed as a root.
        // For now, this is okay, the initial check `if (foundRoot)` is the primary guard.
    }

    // Sort root nodes: visions first, then by title
    rootNodes.sort((a, b) => {
        if (a.type === 'vision' && b.type !== 'vision') return -1;
        if (a.type !== 'vision' && b.type === 'vision') return 1;
        return a.title.localeCompare(b.title);
    });

    for (const root of rootNodes) {
        output += buildNodeText(root, allGoals, 0);
    }

    return output.trim() === "" ? (rootIdOrTitle ? `No hierarchy found for ${rootIdOrTitle}.` : "No goal hierarchy to display.") : output;
}
