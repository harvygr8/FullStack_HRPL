<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';
    import { settings } from '../../../Stores/settingsStore';

    let graphics;
    ipcRenderer.send('get-graphics-info');
    ipcRenderer.on('get-graphics-info', (e, graphicsInfo) => {
        graphics = graphicsInfo;
    });
</script>

<Shell 
    title={"Graphics Card Details"} 
    tooltip={"Information about the GPU"}
>
    {#if graphics}
    <div class="grid grid-cols-2 gap-x-2 gap-y-6">
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Model
            </span>
            <span class="font-medium text-lg">
                {graphics.model}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Vendor
            </span>
            <span class="font-medium text-lg">
                {graphics.vendor}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Bus
            </span>
            <span class="font-medium text-lg">
                {graphics.bus}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                VRAM
            </span>
            <span class="font-medium text-lg">
                {(graphics.vram / 1024).toPrecision(3)}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Connection
            </span>
            <span class="font-medium text-lg">
                {graphics.connection}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Display Model
            </span>
            <span class="font-medium text-lg">
                {graphics.display}
            </span>
        </p>
    </div>
    {:else}
        <p>
            Fetching Required Info...
        </p>
    {/if}
    
</Shell>
