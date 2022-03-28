<script>
    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');


    let cpu;
    ipcRenderer.send('get-cpu-info');
    ipcRenderer.on('get-cpu-info', (e, cpuInfo) => {
        cpu = cpuInfo;
    });
</script>

<Shell
    title={"CPU Information"}
    tooltip={"Information about the CPU"}
>
    {#if cpu}
    <div class="pl-2 flex flex-col items-start text-gray-50">
        <p>&#8226; Processor:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{cpu.brand}</span> </p>
        <p>&#8226; Speed:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{cpu.speed} GHz</span></p>

        <p>&#8226; Cores:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{cpu.cores}</span></p>

        <p>&#8226; Socket:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{cpu.socket}</span></p>

    </div>
    {:else}
        <div class="flex flex-row justify-center">
        <Loader />
        </div>
    {/if}
</Shell>
