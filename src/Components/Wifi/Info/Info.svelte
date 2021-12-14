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
        <p>SSID: <span class="font-bold text-lg">{info[0].ssid}</span></p>
        <p>BSSID: <span class="font-bold text-lg">{info[0].bssid}</span></p>
        <p>Mode: <span class="font-bold text-lg">{info[0].mode}</span></p>
        <p>Channel: <span class="font-bold text-lg">{info[0].channel}</span></p>
        <p>Frequency: <span class="font-bold text-lg">{info[0].frequency}</span> GHz</p>
        <p>Security: <span class="font-bold text-lg">{info[0].security}</span></p>
    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>
