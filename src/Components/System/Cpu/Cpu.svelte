<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let cpu;
    ipcRenderer.send('get-cpu-info');
    ipcRenderer.on('get-cpu-info', (e, cpuInfo) => {
        cpu = cpuInfo;
    });
</script>

<Shell title={"CPU INFORMATION"} tooltip={"Information about the CPU"}>
    <div class="text-gray-50">
    {#if cpu}
        <p>Processor: <span class="font-bold text-lg">{cpu.brand}</span></p>
        <p>Speed: <span class="font-bold text-lg">{cpu.speed}</span> GHz</p>
        <p>Cores: <span class="font-bold text-lg">{cpu.cores}</span></p>
        <p>Socket: <span class="font-bold text-lg">{cpu.socket}</span></p>

    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>
