<!-- src/ui/HabitStreakChart.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import Chart from 'chart.js/auto'; // Import Chart.js

    export let streakData: Array<{ habitName: string, currentStreak: number, longestStreak: number }> = [];

    let chartCanvas: HTMLCanvasElement;
    let chartInstance: Chart | null = null;

    function renderChart() {
        if (!chartCanvas || !streakData || streakData.length === 0) {
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            return;
        }

        if (chartInstance) {
            chartInstance.destroy(); // Destroy previous instance before rendering new one
        }

        const labels = streakData.map(data => data.habitName);
        const currentStreaks = streakData.map(data => data.currentStreak);
        // const longestStreaks = streakData.map(data => data.longestStreak); // Could be added as another dataset

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Current Streak (days)',
                    data: currentStreaks,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                // Example for adding longest streak as a separate bar or on a combined chart
                /*
                {
                    label: 'Longest Streak (days)',
                    data: longestStreaks,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)', // Green
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
                */
            ]
        };

        chartInstance = new Chart(chartCanvas, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Days'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Habits'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Habit Streaks'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    // Re-render chart when streakData changes
    $: if (chartCanvas && streakData) {
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

<div class="habit-streak-chart-container" style="position: relative; height:40vh; width:80vw">
    <canvas bind:this={chartCanvas}></canvas>
</div>

<style>
    .habit-streak-chart-container {
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        margin: 10px 0;
    }
</style>
