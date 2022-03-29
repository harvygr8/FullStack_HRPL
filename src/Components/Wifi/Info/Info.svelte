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

    <div class="h-64 overflow-x-hidden flex flex-col mb-2">

      <div class="flex flex-col mb-2">
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

        <div class="flex flex-col items-start text-gray-50">
            <p>&#9670 SSID</p>
            <span class="ml-6 font-semibold text-lg">{data.ssid}</span>
            <p>&#9670 BSSID</p>
            <span class="ml-6 font-semibold text-lg">{data.bssid}</span>
            <p>&#9670 Frequency</p>
             <span class="ml-6 font-semibold text-lg">{data.frequency}</span>
            <p>&#9670 Security</p>
             <span class="ml-6 font-semibold text-lg">{data.security}</span>
            <p>&#9670 Channel</p>
             <span class="ml-6 font-semibold text-lg">{data.channel}</span>
        </div>
    </div>

    <!-- Display required information -->
    <!-- <div class="grid grid-cols-2 gap-x-2 gap-y-6">
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
                N/A
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
     -->
     <!-- <div class="flex flex-col items-start text-gray-50">
         <p>&#9670 SSID</p>
         <span class="ml-6 font-semibold text-lg">{data.ssid}</span>
         <p>&#9670 BSSID</p>
         <span class="ml-6 font-semibold text-lg">{data.bssid}</span>
         <p>&#9670 Channel</p>
          <span class="ml-6 font-semibold text-lg">{data.channel}</span>
         <p>&#9670 Frequency</p>
          <span class="ml-6 font-semibold text-lg">{data.frequency}</span>
         <p>&#9670 Security</p>
          <span class="ml-6 font-semibold text-lg">{data.security}</span>
     </div> -->

    {:else}
    <div class="flex flex-row justify-center">
      <Loader />
    </div>
    {/if}
</Shell>

<style>
  /* Scrollbar styling */
  ::-webkit-scrollbar {
      width: 12px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
      background: #374151;
      margin-top: 24px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
      background: #8B5CF6;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
      background: #6241ad;
  }
</style>
