<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';
    import { settings } from '../../../Stores/settingsStore';

    let info, data;
    ipcRenderer.send('get-wifi-info');
    ipcRenderer.on('get-wifi-info', (e, wifiInfo) => {
        info = wifiInfo;
        data = info[0];
    });

    // Function to display information for selected wifi connection
    const displayInfo = ssid => {
        data = info.filter(item => item.ssid === ssid)[0];
    };
</script>

<Shell 
    title={"Wifi Information"} 
    tooltip={"General wifi related information"}
>
    {#if info}
    <!-- Available Wifi Connections -->
    <p 
        class="text-sm"
        style="color: {$settings.fontColor2};"
    >
        Available Wifi Connections
    </p>
    <ul class="mb-6">
        {#each info as wifi, _id}
        <li 
            on:click={() => displayInfo(wifi.ssid)} 
            class="cursor-pointer"
        >
            {`${_id+1}. ${wifi.ssid}`}
        </li>
        {/each}
    </ul>
    
    <!-- Display required information -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-6">
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                SSID
            </span>
            <span class="font-medium text-lg">
                {data.ssid}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                BSSID
            </span>
            <span class="font-medium text-lg">
                {data.bssid}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Mode
            </span>
            <span class="font-medium text-lg">
                {data.mode}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Channel
            </span>
            <span class="font-medium text-lg">
                {data.channel}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Frequency
            </span>
            <span class="font-medium text-lg">
                {data.frequency}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Security
            </span>
            <span class="font-medium text-lg">
                {data.security}
            </span>
        </p>
    </div>
    {:else}
        <p>
            Fetching Required Info...
        </p>
    {/if}
</Shell>
