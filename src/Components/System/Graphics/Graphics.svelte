<script>
    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');


    let graphics;
    ipcRenderer.send('get-graphics-info');
    ipcRenderer.on('get-graphics-info', (e, graphicsInfo) => {
        graphics = graphicsInfo;
    });
</script>

<Shell
    title={"Graphics Card Data"}
    tooltip={"Information about the Primary Graphics Driver"}
>
    {#if graphics}
    <div class="pl-2 flex flex-col items-start text-gray-50">
        <p>&#8226; Model:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{graphics.model}</span> </p>
        <p>&#8226; Vendor:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{graphics.vendor}</span></p>
        <p>&#8226; Bus:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{graphics.bus}</span></p>
        <p>&#8226; VRAM:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{graphics.vram} Mb</span></p>
        <p>&#8226; Connection:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{graphics.connection}</span></p>
        <p>&#8226; Display Model:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{graphics.display}</span></p>
        <p>&#8226; Refresh Rate:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{graphics.refresh} Hz</span></p>
        <p>&#8226; Resolution(X):<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{graphics.resx}</span></p>
        <p>&#8226; Resolution(Y):<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{graphics.resy}</span></p>

    </div>
    {:else}
    <div class="flex flex-row justify-center">
      <Loader />
    </div>
    {/if}

</Shell>
