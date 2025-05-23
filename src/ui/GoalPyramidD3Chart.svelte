<!-- src/ui/GoalPyramidD3Chart.svelte -->
<script lang="ts">
    import { onMount, onDestroy, afterUpdate } from 'svelte';
    import * as d3 from 'd3';
    import type { GoalNode } from '../modules/goal-alignment/VisualPyramids'; // Adjust path as needed

    export let goalHierarchyData: GoalNode | null = null;

    let svgRef: SVGSVGElement;
    let containerRef: HTMLDivElement;

    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    let width = 800; // Default width, will be updated
    let height = 600; // Default height

    function getNodeColor(node: d3.HierarchyNode<GoalNode>): string {
        const status = node.data.status;
        if (status?.includes('completed')) return 'var(--color-green, #4CAF50)';
        if (status?.includes('inprogress')) return 'var(--color-blue, #2196F3)';
        if (status === 'vision') return 'var(--color-purple, #9C27B0)';
        if (status === 'goal') return 'var(--color-orange, #FF9800)';
        if (status === 'milestone') return 'var(--color-cyan, #00BCD4)';
        if (status === 'task') return 'var(--color-teal, #009688)';
        return 'var(--text-muted, #ccc)';
    }

    function renderPyramid() {
        if (!svgRef || !goalHierarchyData) {
            d3.select(svgRef).selectAll("*").remove();
            return;
        }

        width = containerRef.clientWidth;
        // Adjust height based on tree depth or fixed
        // For a pyramid/tree, height needs to accommodate depth.
        // Let's make it somewhat dynamic based on expected depth or keep it large.
        // height = Math.max(600, (root.height + 1) * 120); // Example dynamic height

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        d3.select(svgRef).selectAll("*").remove();

        const svg = d3.select(svgRef)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // --- D3 Hierarchy and Tree Layout ---
        const root = d3.hierarchy(goalHierarchyData);
        
        // For a top-down pyramid/tree, size is [width, height]
        // For a left-to-right tree, size is [height, width]
        const treeLayout = d3.tree<GoalNode>().size([innerWidth, innerHeight]);
        treeLayout(root);

        // --- Links ---
        g.append('g')
            .attr('class', 'links')
            .selectAll('path.link')
            .data(root.links())
            .join('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical() // or linkHorizontal for left-to-right
                .x(d => (d as any).x)
                .y(d => (d as any).y)
            )
            .attr('fill', 'none')
            .attr('stroke', 'var(--text-faint, #ccc)')
            .attr('stroke-width', 1.5);

        // --- Nodes ---
        const nodeGroup = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g.node')
            .data(root.descendants())
            .join('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${(d as any).x},${(d as any).y})`);

        nodeGroup.append('circle')
            .attr('r', 8)
            .attr('fill', d => getNodeColor(d))
            .attr('stroke', 'var(--background-primary, white)')
            .attr('stroke-width', 1.5);

        nodeGroup.append('text')
            .attr('dy', '0.31em')
            .attr('x', d => d.children ? -12 : 12) // Position text left for parents, right for leaves
            .attr('text-anchor', d => d.children ? 'end' : 'start')
            .style('font-size', '12px')
            .style('fill', 'var(--text-normal, black)')
            .text(d => d.data.name);
            
        // Add a title for the chart
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2 + 5)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style('fill', 'var(--text-normal, black)')
            .text("Goal Hierarchy Pyramid");
    }

    let resizeObserver: ResizeObserver;

    onMount(() => {
        if (containerRef) {
            width = containerRef.clientWidth;
            renderPyramid();

            resizeObserver = new ResizeObserver(entries => {
                if (!entries || entries.length === 0) return;
                width = entries[0].contentRect.width;
                renderPyramid();
            });
            resizeObserver.observe(containerRef);
        }
    });

    afterUpdate(() => {
        // Handles reactive changes to the `goalHierarchyData` prop itself.
        renderPyramid();
    });

    onDestroy(() => {
        if (resizeObserver && containerRef) {
            resizeObserver.unobserve(containerRef);
        }
    });

</script>

<div class="goal-pyramid-chart-container" bind:this={containerRef}>
    <svg bind:this={svgRef}></svg>
</div>

<style>
    .goal-pyramid-chart-container {
        width: 100%;
        min-height: 500px; /* Ensure a minimum height for the chart */
        height: auto;
        padding: 10px;
        border: 1px solid var(--divider-color, #ccc);
        border-radius: 5px;
        margin: 10px 0;
        overflow: hidden; 
    }
    :global(g.node text) {
        pointer-events: none; /* Prevent text from interfering with circle mouse events if any */
    }
</style>
