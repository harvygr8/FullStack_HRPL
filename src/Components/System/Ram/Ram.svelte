<script>
    const { ipcRenderer } = require('electron');
    import { onMount } from 'svelte';
    import Shell from '../../Misc/Shell.svelte';
    import { settings } from '../../../Stores/settingsStore';

    let ram;
    let ramChart;

    // Editing Here
    onMount(() => {
        const canvas = document.getElementById('ram-doughnut');
        const ctx = canvas.getContext('2d');
        
        ipcRenderer.send('get-ram-info');
        ipcRenderer.on('get-ram-info', (e, ramInfo) => {
            ram = ramInfo;
            // Create chart for RAM monitor
            // If chart already exists, destroy it first
            if (ramChart) ramChart.destroy();
            ramChart = new Chart(ctx , {
                type: 'doughnut',
                options: {
                    cutout: '75%',
                    color: 'rgb(249, 250, 251)',
                },
                data: {
                    labels: ['Total', 'Used', 'Free'],
                    datasets: [{
                        label: 'Ram Monitor',
                        data: [
                            Number(String(ram.total / Math.pow(2, 30)).substring(0, 3 + String(ram.total / Math.pow(2, 30)).indexOf('.'))),
                            Number(String(ram.used / Math.pow(2, 30)).substring(0, 3 + String(ram.total / Math.pow(2, 30)).indexOf('.'))),
                            Number(String(ram.free / Math.pow(2, 30)).substring(0, 3 + String(ram.total / Math.pow(2, 30)).indexOf('.')))
                        ],
                        backgroundColor: [
                            'rgb(91, 33, 182)',
                            'rgb(124, 58, 237)',
                            'rgb(167, 139, 250)'
                        ],
                        hoverOffset: 0,
                        borderColor: '#333',
                        borderWidth: 1
                    }]
                }
            });
        });

        // onDestroy
        return () => {
            ramChart.destroy();
        }
    });
</script>

<Shell 
    title={"Memory Usage Chart"} 
    tooltip={"Plots ram utilization on a doughnut chart"}
>
    <div 
        class="w-4/5 md:w-1/2 mx-auto" 
        id="canvas-container"
    >
        <canvas id="ram-doughnut" />
        {#if ram}
        <p class="text-center text-sm mt-2">
            Memory in GB
        </p>
        {:else}
        <p>
            Fetching Required Info...
        </p>
        {/if}
    </div>
</Shell>
