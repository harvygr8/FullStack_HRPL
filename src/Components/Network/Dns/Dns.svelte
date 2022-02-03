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

<Shell title={"DNS LOOKUP"} tooltip={"DNS Lookup"}>
    <div class="text-gray-50">
        <div class="flex flex-row">
        <input type="text" placeholder="Enter Domain Name" bind:value class="w-10/12 rounded-md m-2 px-1 text-gray-800 font-bold">
            <button on:click={getDnsInfo} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600" type="button">SEARCH</button>
        </div>
        <div class="mt-2 max-h-48 overflow-auto">
            {#if dns}
                {#if !dns.err}
                    <p>&#8226; IP Address</p>
                      <span class="ml-8 font-bold text-lg">{dns.address}</span>
                    <p>&#8226; Nameservers</p>
                      {#each dns.ns as ns }
                        <p class="ml-8 font-bold text-lg">{ns}</p>
                      {/each}
                    <p>&#8226; Mail Exchange</p>
                      {#each dns.mx as mx }
                        <p class="ml-8 font-bold text-lg">{mx}</p>
                      {/each}
                {:else}
                    <p><span class="font-bold text-lg">Error: DNS couldn't be found</span></p>
                {/if}
            {:else}
            <p>&#8226; IP Address</p>
              <span class="ml-8 font-bold text-lg">N/A</span>
            <p>&#8226; Nameservers</p>
              <span class="ml-8 font-bold text-lg">N/A</span>
            <p>&#8226; Mail Exchange</p>
              <span class="ml-8 font-bold text-lg">N/A</span>
            {/if}
        </div>
    </div>
</Shell>
