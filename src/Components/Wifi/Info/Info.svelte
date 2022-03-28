<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');


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
    title={"Wifi Connections"}
    tooltip={"General wifi related information"}
>
    {#if info}
    <!-- Available Wifi Connections -->
    <p
        class="text-sm"
        style="color: {$settings.fontColor2}; text-align:center"
    >
        <!-- Available Wifi Connections -->
    </p>

    <div class="flex flex-row justify-center items-center mb-2">
      <ul class="">
      <!-- add empty check -->
          {#each info as wifi}
          <li
              class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600 cursor-pointer inline-block"
              on:click={() => displayInfo(wifi.ssid)}
          >
          {wifi.ssid}
          </li>
          {/each}
      </ul>
    </div>

    <!-- Display required information -->
    <div class="grid grid-cols-2 gap-x-2 gap-y-6">
        <p class="flex flex-col justify-start items-center">
            <span
                class=" pb-1"
                style="color: {$settings.fontColor2}"
            >
                SSID
            </span>
            <span class="font-semibold text-lg">
                {data.ssid}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span
                class=" pb-1"
                style="color: {$settings.fontColor2}"
            >
                BSSID
            </span>
            <span class="font-semibold text-lg">
                {data.bssid}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span
                class=" pb-1"
                style="color: {$settings.fontColor2}"
            >
                Mode
            </span>
            <span class="font-semibold text-lg">
                <!-- {data.mode} --> N/A
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span
                class=" pb-1"
                style="color: {$settings.fontColor2}"
            >
                Channel
            </span>
            <span class="font-semibold text-lg">
                {data.channel}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span
                class=" pb-1"
                style="color: {$settings.fontColor2}"
            >
                Frequency
            </span>
            <span class="font-semibold text-lg">
                {data.frequency} GHz
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span
                class=" pb-1"
                style="color: {$settings.fontColor2}"
            >
                Security
            </span>
            <span class="font-semibold text-lg">
                {data.security}
            </span>
        </p>
    </div>
    {:else}
    <div class="flex flex-row justify-center">
      <Loader />
    </div>
    {/if}
</Shell>
