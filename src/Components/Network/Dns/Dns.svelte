<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';

    //Electron
    const { ipcRenderer } = require('electron');


    let dns, value = '';

    const getDnsInfo = () => {
        ipcRenderer.send('get-dns-lookup', value);
        ipcRenderer.on('get-dns-lookup', (e, dnsInfo) => {
            dns = dnsInfo;
        });
        // value = '';
    }
</script>

<Shell title={"DNS Lookup"} tooltip={"DNS Lookup Information"}>
    <div class="h-58 text-gray-50">
        <div class="flex flex-row">
        <input type="text" placeholder="Enter Domain Name" bind:value class="w-10/12 rounded-md m-2 px-1 text-gray-800 font-semibold">
            <button on:click={getDnsInfo} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600" type="button">Search</button>
        </div>
        <div class="mt-2 max-h-40 overflow-auto">
            {#if dns}
                {#if !dns.err}
                    <p>&#8226; IP Address</p>
                      <span class="ml-8 font-semibold text-lg">{dns.address}</span>
                    <p>&#8226; Nameservers</p>
                      {#each dns.ns as ns }
                        <p class="ml-8 font-semibold text-lg">{ns}</p>
                      {/each}
                    <p>&#8226; Mail Exchange</p>
                      {#each dns.mx as mx }
                        <p class="ml-8 font-semibold text-lg">{mx}</p>
                      {/each}
                {:else}
                    <p><span class="font-semibold text-lg">Error: DNS couldn't be found</span></p>
                {/if}
            {:else}
            <p>&#8226; IP Address</p>
              <span class="ml-8 font-semibold text-lg">N/A</span>
            <p>&#8226; Nameservers</p>
              <span class="ml-8 font-semibold text-lg">N/A</span>
            <p>&#8226; Mail Exchange</p>
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

</style>
