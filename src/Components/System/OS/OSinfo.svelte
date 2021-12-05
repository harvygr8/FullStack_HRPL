<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let cpu;
    ipcRenderer.send('get-cpu-temps');
    ipcRenderer.on('get-cpu-temps', (e, cpuTemps) => {
        cpu = cpuTemps;
    });
</script>

<Shell title={"OS / ARCH"} tooltip={"Information about CPU Temparatures"}>
    <div class="text-gray-50">
    {#if cpu}
        <p>Platform Architecture: <span class="font-bold text-lg">{cpu.platform}</p>
        <p>Hostname: <span class="font-bold text-lg">{cpu.hostname}</p>
        <p>Kernel: <span class="font-bold text-lg">{cpu.kernel}</p>
        <p>FQDN: <span class="font-bold text-lg">{cpu.fqdn}</p>

    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>
