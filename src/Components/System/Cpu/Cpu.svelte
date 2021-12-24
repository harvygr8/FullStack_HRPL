<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';
    import { settings } from '../../../Stores/settingsStore';

    let cpu;
    ipcRenderer.send('get-cpu-info');
    ipcRenderer.on('get-cpu-info', (e, cpuInfo) => {
        cpu = cpuInfo;
    });
</script>

<Shell 
    title={"Cpu Information"} 
    tooltip={"General information about the CPU"}
>
    {#if cpu}
    <div class="grid grid-cols-2 gap-x-2 gap-y-6">
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Processor
            </span>
            <span class="font-medium text-lg">
                {cpu.brand}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Speed
            </span>
            <span class="font-medium text-lg">
                {cpu.speed} GHz
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Cores
            </span>
            <span class="font-medium text-lg">
                {cpu.cores}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Socket
            </span>
            <span class="font-medium text-lg">
                {cpu.socket}
            </span>
        </p>
    </div>
    {:else}
        <p>
            Fetching Required Info...
        </p>
    {/if}
</Shell>
