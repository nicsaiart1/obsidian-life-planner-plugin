<!-- src/ui/NetWorthChart.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import Chart from 'chart.js/auto';
    import 'chartjs-adapter-moment'; // Ensure this is installed if not already

    export let netWorthData: Array<{ date: string, netWorth: number }> = [];

    let chartCanvas: HTMLCanvasElement;
    let chartInstance: Chart | null = null;

    function renderChart() {
        if (!chartCanvas || !netWorthData || netWorthData.length === 0) {
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            return;
        }

        if (chartInstance) {
            chartInstance.destroy(); // Destroy previous instance
        }

        const labels = netWorthData.map(data => data.date); // Dates for the x-axis
        const values = netWorthData.map(data => data.netWorth);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Net Worth',
                    data: values,
                    fill: true, // Optional: fill area under the line
                    borderColor: 'rgb(75, 192, 75)', // Greenish color
                    backgroundColor: 'rgba(75, 192, 75, 0.2)', // Lighter fill
                    tension: 0.1, // Makes the line slightly curved
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(75, 192, 75)',
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
                        type: 'time',
                        time: {
                            unit: 'month', // Display x-axis labels by month
                            tooltipFormat: 'MMM YYYY', // e.g., 'Jan 2023'
                            displayFormats: {
                                month: 'MMM YYYY' 
                            }
                        },
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        beginAtZero: false, // Net worth can be negative or start far from zero
                        title: {
                            display: true,
                            text: 'Net Worth'
                        },
                        ticks: {
                            // Attempt to format as currency.
                            // This is a basic example. For more complex currency formatting,
                            // you might need a more specific locale or a library.
                            callback: function(value, index, ticks) {
                                if (typeof value === 'number') {
                                    return new Intl.NumberFormat('default', { 
                                        style: 'currency', 
                                        currency: 'USD', // Change as needed, or make configurable
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    }).format(value);
                                }
                                return value;
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Net Worth Over Time'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null && typeof context.parsed.y === 'number') {
                                    label += new Intl.NumberFormat('default', { 
                                        style: 'currency', 
                                        currency: 'USD', // Change as needed
                                        minimumFractionDigits: 2, // Show cents in tooltip
                                        maximumFractionDigits: 2,
                                    }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Re-render chart when data changes
    $: if (chartCanvas && netWorthData) {
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

<div class="net-worth-chart-container" style="position: relative; height:40vh; width:80vw">
    <canvas bind:this={chartCanvas}></canvas>
</div>

<style>
    .net-worth-chart-container {
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        margin: 10px 0;
    }
</style>
