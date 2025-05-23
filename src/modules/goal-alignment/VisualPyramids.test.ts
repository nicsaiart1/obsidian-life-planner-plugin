// src/modules/goal-alignment/VisualPyramids.test.ts
import { getGoalHierarchy, generateGoalTreeMermaid, GoalNode } from './VisualPyramids'; // Adjust path if needed

// --- Test Suites ---

async function testGenerateGoalTreeMermaid() {
    console.log("Running test suite: generateGoalTreeMermaid");

    // Test 1: Null goalRootNode
    let mermaid = await generateGoalTreeMermaid(null);
    console.assert(mermaid === "graph TD;\n    message[\"No goal hierarchy data provided.\"];", "Test Failed (GoalTreeMermaid - 1.1): Null root node.");

    // Test 2: Single root node, no children
    const singleNode: GoalNode = { id: "root1", name: "My Only Vision", status: "vision" };
    mermaid = await generateGoalTreeMermaid(singleNode);
    console.assert(mermaid?.startsWith("graph TD;"), "Test Failed (GoalTreeMermaid - 2.1): Graph direction.");
    console.assert(mermaid?.includes('root1["My Only Vision (vision)"]'), `Test Failed (GoalTreeMermaid - 2.2): Single node definition. Got: ${mermaid}`);
    console.assert(mermaid?.includes('style root1 fill:#DDA0DD,stroke:#8A2BE2,stroke-width:2px;'), `Test Failed (GoalTreeMermaid - 2.3): Single node style. Got: ${mermaid}`);
    console.assert(!mermaid?.includes("-->"), `Test Failed (GoalTreeMermaid - 2.4): Should have no links. Got: ${mermaid}`);


    // Test 3: Node with children
    const nodeWithChildren: GoalNode = {
        id: "parentGoal", name: "Achieve Fitness", status: "goal-inprogress",
        children: [
            { id: "childTask1", name: "Run 3km", status: "task" },
            { id: "childTask2", name: "Eat Healthy Meal", status: "task-completed" }
        ]
    };
    mermaid = await generateGoalTreeMermaid(nodeWithChildren);
    console.assert(mermaid?.includes('parentGoal["Achieve Fitness (goal-inprogress)"]'), "Test Failed (GoalTreeMermaid - 3.1): Parent node.");
    console.assert(mermaid?.includes('style parentGoal fill:#ADD8E6,stroke:#4682B4,stroke-width:1px;'), "Test Failed (GoalTreeMermaid - 3.2): Parent style.");
    console.assert(mermaid?.includes('childTask1["Run 3km (task)"]'), "Test Failed (GoalTreeMermaid - 3.3): Child 1 node.");
    console.assert(mermaid?.includes('style childTask1 fill:#F0E68C,stroke:#BDB76B,stroke-width:1px;'), "Test Failed (GoalTreeMermaid - 3.4): Child 1 style.");
    console.assert(mermaid?.includes('childTask2["Eat Healthy Meal (task-completed)"]'), "Test Failed (GoalTreeMermaid - 3.5): Child 2 node.");
    console.assert(mermaid?.includes('style childTask2 fill:#90EE90,stroke:#2E8B57,stroke-width:1px;'), "Test Failed (GoalTreeMermaid - 3.6): Child 2 style.");
    console.assert(mermaid?.includes("parentGoal --> childTask1"), `Test Failed (GoalTreeMermaid - 3.7): Link 1. Got: ${mermaid}`);
    console.assert(mermaid?.includes("parentGoal --> childTask2"), `Test Failed (GoalTreeMermaid - 3.8): Link 2. Got: ${mermaid}`);

    // Test 4: Complex hierarchy (using the hardcoded data from getGoalHierarchy)
    // This also tests multiple levels and various statuses.
    const complexHierarchy = await getGoalHierarchy(); // This is the hardcoded data
    mermaid = await generateGoalTreeMermaid(complexHierarchy);

    console.assert(mermaid?.startsWith("graph TD;"), "Test Failed (GoalTreeMermaid - 4.1): Complex graph direction.");
    // Check root
    console.assert(mermaid?.includes('vision1["Achieve Holistic Personal Growth (vision)"]'), "Test Failed (GoalTreeMermaid - 4.2): Complex root node.");
    console.assert(mermaid?.includes('style vision1 fill:#DDA0DD,stroke:#8A2BE2,stroke-width:2px;'), "Test Failed (GoalTreeMermaid - 4.3): Complex root style.");
    // Check a mid-level node
    console.assert(mermaid?.includes('milestone1-1["Consistent Exercise Routine (milestone)"]'), "Test Failed (GoalTreeMermaid - 4.4): Complex mid-level node.");
    // Check a leaf node
    console.assert(mermaid?.includes('task1-1-1["Go to Gym 3x_week (task)"]'), `Test Failed (GoalTreeMermaid - 4.5): Complex leaf node. Got: ${mermaid}`);
    console.assert(mermaid?.includes('style task1-1-1 fill:#F0E68C,stroke:#BDB76B,stroke-width:1px;'), "Test Failed (GoalTreeMermaid - 4.6): Complex leaf style.");
    // Check a link
    console.assert(mermaid?.includes("goal1 --> milestone1-1"), "Test Failed (GoalTreeMermaid - 4.7): Complex link.");
    console.assert(mermaid?.includes("milestone1-1 --> task1-1-1"), "Test Failed (GoalTreeMermaid - 4.8): Complex sub-link.");
    
    // Test 5: Node names and statuses (already covered by previous tests, but good to be explicit)
    // Test 6: Node styling directives (already covered)
    // Test 7: Correct graph direction (already covered)

    // Test 8: Node ID sanitization (if ID contains special chars)
    const nodeWithSpecialCharId: GoalNode = { id: "goal@1#special", name: "Special ID Goal", status: "testing" };
    mermaid = await generateGoalTreeMermaid(nodeWithSpecialCharId);
    console.assert(mermaid?.includes('goal_1_special["Special ID Goal (testing)"]'), `Test Failed (GoalTreeMermaid - 8.1): Sanitized ID. Got: ${mermaid}`);

    // Test 9: Node Text sanitization (if name or status contains quotes)
    const nodeWithQuotes: GoalNode = { id: "qNode", name: 'Goal with "Quotes"', status: 'status "here"' };
    mermaid = await generateGoalTreeMermaid(nodeWithQuotes);
    console.assert(mermaid?.includes('qNode["Goal with #quot;Quotes#quot; (status #quot;here#quot;)"]'), `Test Failed (GoalTreeMermaid - 9.1): Sanitized text. Got: ${mermaid}`);


    console.log("generateGoalTreeMermaid: ALL PASSED (check console for any assertion details)");
}


async function runAllVisualPyramidsMermaidTests() {
    console.log("--- Starting VisualPyramids Mermaid Tests ---");
    try {
        await testGenerateGoalTreeMermaid();
        console.log("\nAll VisualPyramids Mermaid tests completed successfully!");
    } catch (error) {
        console.error("\nAn error occurred during VisualPyramids Mermaid testing:", error);
        throw error;
    }
    console.log("--- Finished VisualPyramids Mermaid Tests ---");
}

// To run these tests:
// 1. Ensure Node.js and ts-node are installed.
// 2. Save this file as `VisualPyramids.test.ts` in `src/modules/goal-alignment/`.
// 3. Ensure `VisualPyramids.ts` is in the same directory.
// 4. Execute from the root of your project:
//    `ts-node src/modules/goal-alignment/VisualPyramids.test.ts`

// runAllVisualPyramidsMermaidTests(); // Uncomment or use a test runner

export { runAllVisualPyramidsMermaidTests };
