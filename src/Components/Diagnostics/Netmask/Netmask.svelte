<script>

  //Svelte
  import Shell from '../../Misc/Shell.svelte';

  //Electron
  const { ipcRenderer } = require('electron');


  let netmask, value = '';

  const getNetmaskInfo = () => {
      ipcRenderer.send('get-netmask-info', value);
      ipcRenderer.on('get-netmask-info', (e, dnsInfo) => {
        netmask = dnsInfo;
      });
  }
</script>

<Shell title={"Netmask"} tooltip={"Information related to IPv4 CIDR"}>
  <div class="text-gray-50">
      <div class="flex flex-row">
      <input type="text" placeholder="Enter IPv4 Address" bind:value class="w-10/12 rounded-md m-2 px-1 text-gray-800 font-semibold">
          <button on:click={getNetmaskInfo} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600" type="button">Search</button>
      </div>
      <div class="mt-2 max-h-48 overflow-auto">
          {#if netmask}
              {#if !netmask.err}
              <p>&#8226; Base Address</p>
              <span class="ml-8 font-semibold text-lg">{netmask.base}</span>
            <p>&#8226; Mask</p>
              <span class="ml-8 font-semibold text-lg">{netmask.mask}</span>
            <p>&#8226; Bitmask</p>
              <span class="ml-8 font-semibold text-lg">{netmask.bitmask}</span>
            <p>&#8226; Host Mask</p>
              <span class="ml-8 font-semibold text-lg">{netmask.hostmask}</span>
            <p>&#8226; Broadcast</p>
              <span class="ml-8 font-semibold text-lg">{netmask.broadcast}</span>
            <p>&#8226; Size</p>
              <span class="ml-8 font-semibold text-lg">{netmask.size}</span>
            <p>&#8226; First</p>
              <span class="ml-8 font-semibold text-lg">{netmask.first}</span>
            <p>&#8226; Last</p>
              <span class="ml-8 font-semibold text-lg">{netmask.last}</span>
              {:else}
                  <p><span class="font-semibold text-lg">Error: DNS couldn't be found</span></p>
              {/if}
          {:else}
          <p>&#8226; Base Address</p>
            <span class="ml-8 font-semibold text-lg">N/A</span>
          <p>&#8226; Mask</p>
            <span class="ml-8 font-semibold text-lg">N/A</span>
          <p>&#8226; Bitmask</p>
            <span class="ml-8 font-semibold text-lg">N/A</span>
          <p>&#8226; Host Mask</p>
            <span class="ml-8 font-semibold text-lg">N/A</span>
          <p>&#8226; Broadcast</p>
            <span class="ml-8 font-semibold text-lg">N/A</span>
          <p>&#8226; Size</p>
            <span class="ml-8 font-semibold text-lg">N/A</span>
          <p>&#8226; First</p>
            <span class="ml-8 font-semibold text-lg">N/A</span>
          <p>&#8226; Last</p>
            <span class="ml-8 font-semibold text-lg">N/A</span>
          {/if}
      </div>
  </div>
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

  /* Content height */
  .content-height {
      height: 90%;
  }
</style>
