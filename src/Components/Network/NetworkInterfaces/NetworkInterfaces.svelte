<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'

    //Electron
    const { ipcRenderer } = require('electron');


    let interfaces,pIp;
    ipcRenderer.send('get-network-interfaces');
    ipcRenderer.on('get-network-interfaces', (e, networkInfo) => {
        interfaces = networkInfo;
    });

    ipcRenderer.send('get-p-ip');
    ipcRenderer.on('get-p-ip', (e, ipInfo) => {
        pIp = ipInfo;
    });
</script>

<Shell title={"Available Interfaces"} tooltip={"List of available network interfaces"}>
    <div class="text-gray-50 max-h-48 overflow-auto">
    {#if interfaces}
      <p class="font-semibold text-lg">&#8226; Current Public IP: <span class="font-semibold text-lg text-purple-400">{pIp}</span></p>
        {#if interfaces.length > 0}
            {#if interfaces.length > 1}
                {#each interfaces as {iface, ip4,mac,isDHCP,isInternal}, _id}
                <br/>
                <p>&#8226; <span class="font-semibold text-lg">{iface}</span></p>
                  {#if ip4===""}
                    <p class = "pl-8">IP4 Address: <span class="font-semibold text-lg">N/A</span></p>
                  {:else}
                    <p class = "pl-8">IP4 Address: <span class="font-semibold text-lg">{ip4}</span></p>
                  {/if}
                    <p class = "pl-8">MAC Address: <span class="font-semibold text-lg">{mac}</span></p>
                    <p class = "pl-8">DHCP: <span class="font-semibold text-lg">{isDHCP}</span></p>
                    <p class = "pl-8">Virtual: <span class="font-semibold text-lg">{isInternal}</span></p>


                {/each}
            {:else}
                <p>1. <span class="font-semibold text-lg">{interfaces.iface}</span></p>
                <p class = "pl-8" >IP4 Address: <span class="font-semibold text-lg">{interfaces.ip4}</span></p>
            {/if}
        {:else}
            <p>Couldn't find any interfaces.</p>
        {/if}
    {:else}
      <div class="flex flex-row justify-center">
        <Loader />
      </div>
    {/if}
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
