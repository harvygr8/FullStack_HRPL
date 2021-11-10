<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let cpu;
    ipcRenderer.send('get-cpu-temps');
    ipcRenderer.on('get-cpu-temps', (e, cpuTemps) => {
        cpu = cpuTemps;
    });
</script>

<Shell title={"CPU Temps"} tooltip={"Information about CPU Temparatures"}>
    <div class="text-gray-50">
    {#if cpu}
        <p>Temparature: {cpu.main} &#176;C</p>
        <p>Max Temparature: {cpu.max} &#176;C</p>
    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>