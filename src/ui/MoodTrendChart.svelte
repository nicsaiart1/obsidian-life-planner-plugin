<!-- src/ui/MoodTrendChart.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import Chart from 'chart.js/auto'; // Import Chart.js
    import 'chartjs-adapter-moment'; // Import the Moment.js adapter for time scale

    export let moodData: Array<{ date: string, moodValue: number }> = [];

    let chartCanvas: HTMLCanvasElement;
    let chartInstance: Chart | null = null;

    function renderChart() {
        if (!chartCanvas || !moodData || moodData.length === 0) {
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            return;
        }

        if (chartInstance) {
            chartInstance.destroy(); // Destroy previous instance
        }

        const labels = moodData.map(data => data.date); // Dates for the x-axis
        const values = moodData.map(data => data.moodValue);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Mood Level (1-5)',
                    data: values,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1, // Makes the line slightly curved
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(75, 192, 192)',
                }
            ]
        };

        chartInstance = new Chart(chartCanvas, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time', // Use time scale
                        time: {
                            unit: 'day',
                            tooltipFormat: 'll', // e.g., 'Sep 4, 1986'
                            displayFormats: {
                                day: 'MMM D' // e.g., 'Sep 4'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: false, // Mood scale doesn't necessarily start at 0
                        min: 1,  // Assuming mood values are 1-5
                        max: 5,
                        ticks: {
                            stepSize: 1 // Display ticks for 1, 2, 3, 4, 5
                        },
                        title: {
                            display: true,
                            text: 'Mood Level'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Mood Trend Over Time'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            // Optional: customize tooltip label if needed
                            // label: function(context) {
                            //     let label = context.dataset.label || '';
                            //     if (label) {
                            //         label += ': ';
                            //     }
                            //     if (context.parsed.y !== null) {
                            //         label += context.parsed.y;
                            //     }
                            //     return label;
                            // }
                        }
                    }
                }
            }
        });
    }

    // Re-render chart when moodData changes
    $: if (chartCanvas && moodData) {
        renderChart();
    }

    onMount(() => {
        // Initial render
        renderChart();
    });

    onDestroy(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }
    });
</script>

<div class="mood-trend-chart-container" style="position: relative; height:40vh; width:80vw">
    <canvas bind:this={chartCanvas}></canvas>
</div>

<style>
    .mood-trend-chart-container {
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        margin: 10px 0;
    }
</style>
