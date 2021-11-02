<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let cpu;
    ipcRenderer.send('get-cpu-info');
    ipcRenderer.on('get-cpu-info', (e, cpuInfo) => {
        cpu = cpuInfo;
    });
</script>

<Shell title={"CPU Info"} tooltip={"Information about the CPU"}>
    <div class="text-gray-50">
    {#if cpu}
        <p>Processor: {cpu.brand}</p>
        <p>Speed: {cpu.speed} GHz</p>
        <p>Cores: {cpu.cores}</p>
    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>