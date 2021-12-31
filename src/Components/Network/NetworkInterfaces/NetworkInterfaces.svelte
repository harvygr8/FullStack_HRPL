<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'

    //Electron
    const { ipcRenderer } = require('electron');

    let interfaces;
    ipcRenderer.send('get-network-interfaces');
    ipcRenderer.on('get-network-interfaces', (e, networkInfo) => {
        interfaces = networkInfo;
    });
</script>

<Shell title={"AVAILABLE INTERFACES"} tooltip={"List of available network interfaces"}>
    <div class="text-gray-50">
    {#if interfaces}
        {#if interfaces.length > 0}
            {#if interfaces.length > 1}
                {#each interfaces as {iface, ip4}, _id}
                <p>&#8226; <span class="font-bold text-lg">{iface}</span></p>
                  {#if ip4===""}
                    <p class = "pl-8">IP4 Address: <span class="font-bold text-lg">N/A</span></p>
                  {:else}
                    <p class = "pl-8">IP4 Address: <span class="font-bold text-lg">{ip4}</span></p>
                  {/if}
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
