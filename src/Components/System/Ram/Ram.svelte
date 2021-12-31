<script>
    //Svelte
    import { onMount } from 'svelte';
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte';
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');

    let ram;
    let ramChart;

    setInterval(()=>{
      ipcRenderer.send('get-ram-info');
    },4000);

    // Editing Here
    onMount(() => {
      // setInterval(()=>{
        ipcRenderer.send('get-ram-info');
        const canvas = document.getElementById('ram-doughnut');
        const ctx = canvas.getContext('2d');

        ipcRenderer.on('get-ram-info', (e, ramInfo) => {
            ram = ramInfo;
            // Create chart for RAM monitor
            // If chart already exists, destroy it first
            if (ramChart) ramChart.destroy();
            ramChart = new Chart(ctx , {
                type: 'doughnut',
                options: {
                    animation:{
                      duration:0
                    },
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
                        borderColor: '#000000',
                        borderWidth: .5
                    }]
                }
            });
        });
      // },2000);

        // onDestroy
        return () => {
            ramChart.destroy();
        }
    });
</script>

<Shell
    title={"RAM USAGE"}
    tooltip={"RAM utilization plotted on a doughnut chart"}
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
        <div class="flex flex-row justify-center">
          <Loader />
        </div>
        {/if}
    </div>
</Shell>
