<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let info;
    ipcRenderer.send('get-wifi-info');
    ipcRenderer.on('get-wifi-info', (e, wifiInfo) => {
        info = wifiInfo;
    });
</script>

<Shell title={"WIFI INFORMATION"} tooltip={"General Wifi related information"}>
    <div class="text-gray-50">
    {#if info}
        <p>SSID: <span class="font-bold text-lg">{info.ssid}</span></p>
        <p>BSSID: <span class="font-bold text-lg">{info.bssid}</span></p>
        <p>Mode: <span class="font-bold text-lg">{info.mode}</span></p>
        <p>Channel: <span class="font-bold text-lg">{info.channel}</span></p>
        <p>Frequency: <span class="font-bold text-lg">{info.frequency}</span> GHz</p>
        <p>Security: <span class="font-bold text-lg">{info.security}</span></p>
    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>
