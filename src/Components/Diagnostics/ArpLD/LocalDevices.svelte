<script>
    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');


    let data;
    ipcRenderer.send('get-local-devices');
    ipcRenderer.on('get-local-devices', (e, deviceInfo) => {
        data = deviceInfo;
        console.log(data);
    });
</script>

<Shell
    title={"Local Devices"}
    tooltip={"Shows IPs of devices connected to the local network"}
>
    {#if data}

    <div class="h-64 overflow-x-hidden">
    <!-- <div class="pl-2 mb-3 flex flex-col items-start text-gray-50">
        <p>&#8226; IP:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{d.ip}</span> </p>
        <p>&#8226; Mac:<span class="ml-2 font-bold text-lg" style="color: {$settings.fontColor2}">{d.mac}</span></p>
    </div> -->

    <table class="">

      <thead class="bg-gray border-b">
        <tr>
          <th scope="col" class="truncate text-sm font-medium px-24 py-1">
            Local IP
          </th>
          <th scope="col" class="truncate text-sm font-medium px-24 py-1">
            Mac Address
          </th>
        </tr>
      </thead>
      <tbody>

      {#each data as d}

        <tr class="bg-gray border-b">
          <td class="px-5 py-1 whitespace-nowrap text-sm font-medium text-center">
            {d.ip}
          </td>
          <td class=" px-5 py-1 text-sm font-light whitespace-nowrap text-center">
            {d.mac}
          </td>
        </tr>

        {/each}

      </tbody>

    </table>

    </div>

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
