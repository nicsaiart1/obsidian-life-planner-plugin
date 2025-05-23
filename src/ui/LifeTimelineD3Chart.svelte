<!-- src/ui/LifeTimelineD3Chart.svelte -->
<script lang="ts">
    import { onMount, onDestroy, afterUpdate } from 'svelte';
    import * as d3 from 'd3';
    import type { LifeEvent } from '../modules/timeline/TimelineManager'; // Adjust path as needed

    export let lifeEvents: LifeEvent[] = [];

    let svgRef: SVGSVGElement;
    let tooltipRef: HTMLDivElement;
    let containerRef: HTMLDivElement;

    const margin = { top: 40, right: 50, bottom: 60, left: 50 };
    let width = 800; // Default width, will be updated
    let height = 200; // Default height for the timeline itself

    function renderTimeline() {
        if (!svgRef || !lifeEvents || lifeEvents.length === 0) {
            d3.select(svgRef).selectAll("*").remove(); // Clear previous render
            return;
        }

        // Use container width for responsiveness
        width = containerRef.clientWidth;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        d3.select(svgRef).selectAll("*").remove(); // Clear previous render

        const svg = d3.select(svgRef)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // --- Time Scale ---
        const dates = lifeEvents.map(d => d.date);
        const timeDomain = d3.extent(dates) as [Date, Date]; // Type assertion

        if (!timeDomain[0] || !timeDomain[1]) {
            console.warn("Could not determine time domain for events.");
            return;
        }
        
        // Add some padding to the domain if there's only one event
        if (timeDomain[0].getTime() === timeDomain[1].getTime()) {
            timeDomain[0] = d3.timeYear.offset(timeDomain[0], -1);
            timeDomain[1] = d3.timeYear.offset(timeDomain[1], 1);
        }


        const xScale = d3.scaleTime()
            .domain(timeDomain)
            .range([0, innerWidth]);

        // --- Axis ---
        const xAxis = d3.axisBottom(xScale)
            .ticks(d3.timeYear.every(1)) // Tick for every year
            .tickFormat(d3.timeFormat('%Y')); // Format as year

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${innerHeight / 2})`) // Position axis in the middle
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "middle");


        // --- Event Markers (Circles) ---
        const eventGroup = g.append('g').attr('class', 'events');

        eventGroup.selectAll('circle.event-marker')
            .data(lifeEvents)
            .join('circle')
            .attr('class', 'event-marker')
            .attr('cx', d => xScale(d.date))
            .attr('cy', innerHeight / 2) // Position on the axis line
            .attr('r', 6) // Radius of the circle
            .attr('fill', (d) => d.type === 'Career' ? 'steelblue' : (d.type === 'Education' ? 'coral' : 'grey'))
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(tooltipRef)
                    .style('opacity', 1)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 20}px`)
                    .html(`
                        <strong>${d.title}</strong><br/>
                        Date: ${moment(d.date).format('MMM D, YYYY')}<br/>
                        Type: ${d.type}<br/>
                        ${d.description ? `Desc: ${d.description.substring(0, 100)}${d.description.length > 100 ? '...' : ''}` : ''}
                    `);
            })
            .on('mouseout', () => {
                d3.select(tooltipRef).style('opacity', 0);
            });

        // --- Event Labels (optional, can get cluttered) ---
        /*
        eventGroup.selectAll('text.event-label')
            .data(lifeEvents)
            .join('text')
            .attr('class', 'event-label')
            .attr('x', d => xScale(d.date))
            .attr('y', (d, i) => (innerHeight / 2) - 10 - (i % 2 * 20)) // Alternate above/below axis
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .text(d => d.title.substring(0,15));
        */
    }
    
    // For responsiveness on resize
    let resizeObserver: ResizeObserver;

    onMount(() => {
        // Moment.js is a global from Obsidian, ensure it's available or import explicitly if needed
        // For this component, D3's time formatting is used mostly. Moment for tooltip for convenience.
        if (typeof moment === 'undefined') {
            console.warn("Moment.js not globally available. Tooltip date formatting might be affected.");
        }

        if (containerRef) {
            width = containerRef.clientWidth; // Initial width
            renderTimeline(); // Initial render

            resizeObserver = new ResizeObserver(entries => {
                if (!entries || entries.length === 0) return;
                width = entries[0].contentRect.width;
                renderTimeline(); // Re-render on resize
            });
            resizeObserver.observe(containerRef);
        }
    });

    afterUpdate(() => {
        // This ensures that if lifeEvents prop changes, the chart re-renders.
        // The onMount logic with ResizeObserver handles initial render and resize.
        // This handles reactive changes to the `lifeEvents` prop itself.
        renderTimeline();
    });

    onDestroy(() => {
        if (resizeObserver && containerRef) {
            resizeObserver.unobserve(containerRef);
        }
        if (tooltipRef) { // Clean up tooltip if it was added to body
             // tooltipRef.remove(); // If appended to body, not just styled
        }
    });

</script>

<div class="timeline-chart-container" bind:this={containerRef}>
    <svg bind:this={svgRef}></svg>
    <div class="d3-tooltip" bind:this={tooltipRef} style="opacity:0; position:absolute; pointer-events:none;"></div>
</div>

<style>
    .timeline-chart-container {
        width: 100%;
        height: auto; /* Or a fixed height if preferred */
        padding: 10px;
        border: 1px solid var(--divider-color, #ccc); /* Obsidian theme variable */
        border-radius: 5px;
        margin: 10px 0;
        overflow: hidden; /* Prevents SVG overflow issues if any */
    }

    /* Style for the tooltip */
    .d3-tooltip {
        background-color: var(--background-secondary, #f9f9f9);
        border: 1px solid var(--divider-color, #ccc);
        border-radius: 4px;
        padding: 8px;
        font-size: 12px;
        color: var(--text-normal, #333);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 30; /* Ensure it's above other elements */
        /* pointer-events: none; -- set in JS */
        /* opacity: 0; -- set in JS */
        /* position: absolute; -- set in JS */
        max-width: 250px;
    }

    /* Styling for D3 elements (can be done in JS too) */
    :global(.x-axis path) {
        stroke: var(--text-faint, #aaa);
    }
    :global(.x-axis .tick line) {
        stroke: var(--text-faint, #aaa);
    }
    :global(.x-axis .tick text) {
        fill: var(--text-muted, #666);
        font-size: 10px;
    }
    :global(circle.event-marker:hover) {
        stroke: black;
        stroke-width: 1.5px;
        opacity: 0.8;
    }
</style>
