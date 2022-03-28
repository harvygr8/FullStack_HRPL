<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let ssid;
    ipcRenderer.send('get-wifi-info');
    ipcRenderer.on('get-wifi-info', (e, wifiInfo) => {
        ssid = wifiInfo;
    });
</script>

<Shell title={"Wifi Networks"} tooltip={"SSID of all available wifi networks"}>
    <div class="text-gray-50">
    {#if ssid}
        {#if ssid.length > 1}
            {#each ssid as {ssid}, _id}
            <p>{_id+1}. <span class="font-bold text-lg">{ssid}</span></p>
            {/each}
        {:else}
        <p>SSID: <span class="font-bold text-lg">{ssid.ssid}</span></p>
        {/if}
    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>
