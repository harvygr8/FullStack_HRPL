<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let graphics;
    ipcRenderer.send('get-graphics-info');
    ipcRenderer.on('get-graphics-info', (e, graphicsInfo) => {
        graphics = graphicsInfo;
    });
</script>

<Shell title={"GRAPHIC CARD INFORMATION"} tooltip={"Information about the GPU"}>
    <div class="text-gray-50">
    {#if graphics}
        <p>Model: <span class="font-bold text-lg">{graphics.model}</p>
        <p>Vendor: <span class="font-bold text-lg">{graphics.vendor}</p>
        <p>Bus: <span class="font-bold text-lg">{graphics.bus}</p>
        <p>VRAM: <span class="font-bold text-lg">{(graphics.vram / 1024).toPrecision(3)} GB</p>
        <p>Connection Type: <span class="font-bold text-lg">{graphics.connection}</p>
        <p>Display Model: <span class="font-bold text-lg">{graphics.display}</p>


    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>
