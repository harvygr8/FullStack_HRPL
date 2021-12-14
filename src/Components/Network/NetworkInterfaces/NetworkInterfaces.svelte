<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let interfaces;
    ipcRenderer.send('get-network-interfaces');
    ipcRenderer.on('get-network-interfaces', (e, networkInfo) => {
        interfaces = networkInfo;
    });
</script>

<Shell title={"AVAILABLE NETWORK INTERFACES"} tooltip={"List of available network interfaces"}>
    <div class="text-gray-50">
    {#if interfaces}
        {#if interfaces.length > 0}
            {#if interfaces.length > 1}
                {#each interfaces as {iface, ip4}, _id}
                <p>{_id+1}. <span class="font-bold text-lg">{iface}</span></p>
                <p>IP4 Address: <span class="font-bold text-lg">{ip4}</span></p>
                {/each}
            {:else}
                <p>1. <span class="font-bold text-lg">{interfaces.iface}</span></p>
                <p>IP4 Address: <span class="font-bold text-lg">{interfaces.ip4}</span></p>
            {/if}   
        {:else}
            <p>Couldn't find any interfaces.</p>
        {/if}
    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>
