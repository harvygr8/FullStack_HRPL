<script>
    const { ipcRenderer } = require('electron');
    import { onMount } from 'svelte';
    import Shell from '../../Misc/Shell.svelte';

    // Editing Here
    let ram;
    onMount(() => {
        // Get context of canvas for drawing chart
        const ctx = document.getElementById('ram-doughnut').getContext('2d');
        ipcRenderer.send('get-ram-info');
        ipcRenderer.on('get-ram-info', (e, ramInfo) => {
            ram = ramInfo;
            // Create chart for RAM monitor
            const ramChart = new Chart(ctx , {
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
    });
</script>

<Shell title={"Ram Monitor"} tooltip={"Information about RAM"}>
    <div>
        <canvas id="ram-doughnut"></canvas>
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