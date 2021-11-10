<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let graphics;
    ipcRenderer.send('get-graphics-info');
    ipcRenderer.on('get-graphics-info', (e, graphicsInfo) => {
        graphics = graphicsInfo;
    });
</script>

<Shell title={"Graphics Info"} tooltip={"Information about the GPU"}>
    <div class="text-gray-50">
    {#if graphics}
        <p>Model: {graphics.model}</p>
        <p>Vendor: {graphics.vendor}</p>
        <p>Bus: {graphics.bus}</p>
        <p>VRAM: {(graphics.vram / 1024).toPrecision(3)} GB</p>
    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>