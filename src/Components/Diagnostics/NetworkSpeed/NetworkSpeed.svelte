<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let networkSpeed;

    ipcRenderer.send('get-network-speed');
    ipcRenderer.on('get-network-speed', (e, speedInfo) => {
        networkSpeed = speedInfo;
    });

</script>

<Shell title={"NETWORK SPEED"} tooltip={"List network speed"}>
    <div class="text-gray-50">
        <div>
            {#if networkSpeed}
                <p>Input Speed (Mb): <span class="font-bold text-lg">{networkSpeed.total.inputMb}</span></p>
                <p>Output Speed (Mb): <span class="font-bold text-lg">{networkSpeed.total.OutputMb}</span></p>
            {:else}
                <p><span class="font-bold text-lg">Error: Couldn't get network speeds</span></p>
            {/if}
        </div>
    </div>
</Shell>
