// src/modules/goal-alignment/VisualPyramids.ts

export interface GoalNode {
  id: string;
  name: string;
  status?: string; // e.g., 'vision', 'goal-inprogress', 'goal-completed', 'milestone', 'task'
  children?: GoalNode[];
}

/**
 * Fetches the goal hierarchy.
 * 
 * FOR THIS SUBTASK: This function returns a hardcoded complex GoalNode structure
 * to simulate data that would ideally come from GoalManager.ts or by parsing notes.
 * This allows focusing on the D3.js visualization part.
 * 
 * In a real implementation, this function would:
 * 1. Fetch raw goal data (e.g., from GoalManager.ts, or by querying Obsidian notes).
 * 2. Transform this raw data into the GoalNode tree structure.
 */
export async function getGoalHierarchy(): Promise<GoalNode | null> {
    // Simulate an async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Hardcoded sample data for the pyramid visualization
    const hardcodedGoalHierarchy: GoalNode = {
        id: "vision1",
        name: "Achieve Holistic Personal Growth",
        status: "vision",
        children: [
            {
                id: "goal1",
                name: "Improve Physical Health",
                status: "goal-inprogress",
                children: [
                    {
                        id: "milestone1-1",
                        name: "Consistent Exercise Routine",
                        status: "milestone",
                        children: [
                            { id: "task1-1-1", name: "Go to Gym 3x/week", status: "task" },
                            { id: "task1-1-2", name: "Morning Yoga 15min/day", status: "task-completed" }
                        ]
                    },
                    {
                        id: "milestone1-2",
                        name: "Healthy Eating Habits",
                        status: "milestone",
                        children: [
                            { id: "task1-2-1", name: "Meal Prep Lunches", status: "task-inprogress" },
                            { id: "task1-2-2", name: "Reduce Sugar Intake", status: "task" }
                        ]
                    }
                ]
            },
            {
                id: "goal2",
                name: "Advance Career",
                status: "goal-completed",
                children: [
                    {
                        id: "milestone2-1",
                        name: "Learn New Programming Language",
                        status: "milestone-completed",
                        children: [
                            { id: "task2-1-1", name: "Complete Online Course", status: "task-completed" },
                            { id: "task2-1-2", name: "Build Portfolio Project", status: "task-completed" }
                        ]
                    },
                    {
                        id: "milestone2-2",
                        name: "Network with Professionals",
                        status: "milestone",
                        children: [
                            { id: "task2-2-1", name: "Attend 2 Industry Meetups", status: "task" },
                            { id: "task2-2-2", name: "Connect with 5 People on LinkedIn", status: "task-inprogress" }
                        ]
                    }
                ]
            },
            {
                id: "goal3",
                name: "Enhance Mindfulness & Well-being",
                status: "goal-inprogress",
                children: [
                    {
                        id: "milestone3-1",
                        name: "Daily Meditation Practice",
                        status: "milestone",
                        children: [
                            { id: "task3-1-1", name: "Meditate 10 mins daily", status: "task-inprogress" }
                        ]
                    },
                    {
                        id: "milestone3-2",
                        name: "Digital Detox",
                        status: "milestone",
                         children: [
                            { id: "task3-2-1", name: "No screens 1hr before bed", status: "task" }
                        ]
                    }
                ]
            }
        ]
    };

    return hardcodedGoalHierarchy;
}

/**
 * Generates a Mermaid graph definition string for a goal tree.
 *
 * @param goalRootNode - The root GoalNode of the hierarchy.
 * @returns A promise that resolves to a Mermaid graph string or null if the root node is null.
 */
export async function generateGoalTreeMermaid(goalRootNode: GoalNode | null): Promise<string | null> {
    if (!goalRootNode) {
        return "graph TD;\n    message[\"No goal hierarchy data provided.\"];";
    }

    let mermaidString = "graph TD;\n"; // Top-Down graph
    const nodes: string[] = [];
    const links: string[] = [];

    // Helper function to sanitize node IDs and text for Mermaid
    const sanitizeId = (id: string): string => {
        return id.replace(/[^\w-]/g, '_'); // Keep alphanumeric, underscore, hyphen
    };
    const sanitizeText = (text: string): string => {
        // Basic sanitization for Mermaid labels (escape quotes)
        return text.replace(/"/g, '#quot;');
    };

    function traverse(node: GoalNode, parentId?: string) {
        const nodeId = sanitizeId(node.id);
        let nodeText = sanitizeText(node.name);
        if (node.status) {
            nodeText += ` (${sanitizeText(node.status)})`;
        }
        
        // Add node definition (ensuring it's unique)
        if (!nodes.includes(nodeId)) {
            nodes.push(nodeId); // Track added nodes to avoid duplicate definitions
            mermaidString += `    ${nodeId}["${nodeText}"];\n`;

            // Optional: Basic styling based on status (can be expanded)
            if (node.status === 'vision') {
                mermaidString += `    style ${nodeId} fill:#DDA0DD,stroke:#8A2BE2,stroke-width:2px; \n`; // Plum/BlueViolet
            } else if (node.status?.includes('completed')) {
                mermaidString += `    style ${nodeId} fill:#90EE90,stroke:#2E8B57,stroke-width:1px; \n`; // LightGreen/SeaGreen
            } else if (node.status?.includes('inprogress')) {
                mermaidString += `    style ${nodeId} fill:#ADD8E6,stroke:#4682B4,stroke-width:1px; \n`; // LightBlue/SteelBlue
            } else if (node.status === 'task') {
                 mermaidString += `    style ${nodeId} fill:#F0E68C,stroke:#BDB76B,stroke-width:1px; \n`; // Khaki/DarkKhaki
            }
        }

        if (parentId) {
            links.push(`    ${parentId} --> ${nodeId};\n`);
        }

        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                traverse(child, nodeId);
            }
        }
    }

    traverse(goalRootNode);
    
    // Add all unique links to the main string
    mermaidString += links.join('');

    if (nodes.length === 0) { // Should not happen if goalRootNode is not null, but as a fallback
        return "graph TD;\n    message[\"Goal hierarchy is empty or invalid.\"];";
    }

    return mermaidString;
}
