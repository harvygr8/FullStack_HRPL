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

<Shell title={"AVAILABLE INTERFACES"} tooltip={"List of available network interfaces"}>
    <div class="text-gray-50 max-h-48 overflow-auto">
    {#if interfaces}
      <p class="font-bold text-lg">&#8226; Current Public IP: <span class="font-bold text-lg text-purple-400">{pIp}</span></p>
        {#if interfaces.length > 0}
            {#if interfaces.length > 1}
                {#each interfaces as {iface, ip4,mac,isDHCP,isInternal}, _id}
                <br/>
                <p>&#8226; <span class="font-bold text-lg">{iface}</span></p>
                  {#if ip4===""}
                    <p class = "pl-8">IP4 Address: <span class="font-bold text-lg">N/A</span></p>
                  {:else}
                    <p class = "pl-8">IP4 Address: <span class="font-bold text-lg">{ip4}</span></p>
                  {/if}
                    <p class = "pl-8">MAC Address: <span class="font-bold text-lg">{mac}</span></p>
                    <p class = "pl-8">DHCP: <span class="font-bold text-lg">{isDHCP}</span></p>
                    <p class = "pl-8">Virtual: <span class="font-bold text-lg">{isInternal}</span></p>


                {/each}
            {:else}
                <p>1. <span class="font-bold text-lg">{interfaces.iface}</span></p>
                <p class = "pl-8" >IP4 Address: <span class="font-bold text-lg">{interfaces.ip4}</span></p>
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
