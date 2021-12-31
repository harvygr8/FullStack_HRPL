<script>

    //Svelte
    import { onMount } from 'svelte';
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');


    let use;
    let useChart;

    const chartInterval = setInterval(()=>{
      ipcRenderer.send('get-cpu-usage');
    },2000);

    // Editing Here
    onMount(() => {
      // setInterval(()=>{
        const canvas = document.getElementById('use-doughnut');
        const ctx = canvas.getContext('2d');

        ipcRenderer.send('get-cpu-usage');
        ipcRenderer.on('get-cpu-usage', (e, usageInfo) => {
            use = usageInfo;
            if (useChart) useChart.destroy();
            useChart = new Chart(ctx , {
                type: 'pie',
                options: {
                    animation: {
                        duration: 0,
                    },
                    color: 'rgb(249, 250, 251)',
                },
                data: {
                    labels: ['System Load', 'Load Capacity'],
                    datasets: [{
                        label: 'CPU Monitor',
                        data: [
                          // use.currSys ,
                          use.curr,
                          100.00
                        ],
                        backgroundColor: [
                            'rgb(167, 139, 250)',
                            'rgb(124, 58, 237)',
                            'rgb(91, 33, 182)'
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
            useChart.destroy();
            clearInterval(chartInterval);
        }
    });
</script>

<Shell
    title={"CPU LOAD"}
    tooltip={"CPU Load plotted on a Pie chart"}
>
    <div
        class="w-4/5 md:w-1/2 mx-auto"
        id="canvas-container"
    >
        <canvas id="use-doughnut" />
        {#if use}
        <p class="text-center text-sm mt-2">
            CPU Load in %
        </p>
        {:else}
        <div class="flex flex-row justify-center">
          <Loader />
        </div>
        {/if}
    </div>
</Shell>
