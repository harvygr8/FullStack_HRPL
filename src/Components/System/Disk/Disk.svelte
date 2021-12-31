<script>

    //Svelte
    import { onMount } from 'svelte';
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');


    let disk;
    let diskChart;

    // Editing Here
    onMount(() => {
      // setInterval(()=>{
        const canvas = document.getElementById('disk-doughnut');
        const ctx = canvas.getContext('2d');

        ipcRenderer.send('get-disk-usage');
        ipcRenderer.on('get-disk-usage', (e, dInfo) => {
            disk = dInfo;
            console.log(disk);
            if (diskChart) diskChart.destroy();
            diskChart = new Chart(ctx , {
                type: 'pie',
                options: {
                    animation: {
                        duration: 0,
                    },
                    color: 'rgb(249, 250, 251)',
                },
                data: {
                    labels: ['Total Space', 'Free Space'],
                    datasets: [{
                        label: 'Disk Usage Monitor',
                        data: [
                            disk.total / Math.pow(10, 9),
                            disk.free / Math.pow(10, 9)
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
          diskChart.destroy();
        }
    });
</script>

<Shell
    title={"DISK SPACE"}
    tooltip={"Disk Space plotted on a Pie chart"}
>
    <div
        class="w-4/5 md:w-1/2 mx-auto"
        id="canvas-container"
    >
        <canvas id="disk-doughnut" />
        {#if disk}
        <p class="text-center text-sm mt-2">
            Disk Space in GB
        </p>
        {:else}
        <div class="flex flex-row justify-center">
          <Loader />
        </div>
        {/if}
    </div>
</Shell>
