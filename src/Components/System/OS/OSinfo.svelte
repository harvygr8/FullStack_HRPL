<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');


    let os;
    ipcRenderer.send('get-os-info');
    ipcRenderer.on('get-os-info', (e, osInfo) => {
        os = osInfo;
    });
</script>

<Shell
    title={"Operating System"}
    tooltip={"Information about the operating system"}
>
    {#if os}
    <div class="pl-2 flex flex-col items-start text-gray-50">
        <p>&#8226; Platform:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{os.platform}</span> </p>
        <p>&#8226; Hostname:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{os.hostname}</span></p>

        <p>&#8226; Kernel:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{os.kernel}</span></p>

        <p>&#8226; Architecture:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{os.arch}</span></p>

    </div>
    {:else}
      <div class="flex flex-row justify-center">
      <Loader />
      </div>
    {/if}
</Shell>
