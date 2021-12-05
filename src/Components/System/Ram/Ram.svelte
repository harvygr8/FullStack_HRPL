<script>
    const { ipcRenderer } = require('electron');
    import { onMount } from 'svelte';
    import Shell from '../../Misc/Shell.svelte';

    // Editing Here
    let ram;
    let ramChart;
    onMount(() => {
        const canvas = document.getElementById('ram-doughnut');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ipcRenderer.send('get-ram-info');
        ipcRenderer.on('get-ram-info', (e, ramInfo) => {
            ram = ramInfo;
            // Create chart for RAM monitor
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

        return () => {
          chartStatus.destroy();
        }
    });
</script>

<Shell title={"RAM USAGE CHART"} tooltip={"Plots Ram utilization on a doughnut chart"}>
    <div class="w-4/5 md:w-1/2 mx-auto">
        <canvas bind:this={canvas} id="ram-doughnut"></canvas>
    {#if ram}
        <p class="text-center text-gray-50 text-sm mt-2">Memory in GB</p>
            <!-- <p>Total Memory: {String(ram.total / Math.pow(2, 30)).substring(0, 3 + String(ram.total / Math.pow(2, 30)).indexOf('.'))} GB</p>
            <p>Used Memory: {String(ram.used / Math.pow(2, 30)).substring(0, 3 + String(ram.total / Math.pow(2, 30)).indexOf('.'))} GB</p>
            <p>Free Memory: {String(ram.free / Math.pow(2, 30)).substring(0, 3 + String(ram.total / Math.pow(2, 30)).indexOf('.'))} GB</p> -->
    {:else}
        <p class="text-gray-50">Fetching Required Info...</p>
    {/if}
    </div>
</Shell>
