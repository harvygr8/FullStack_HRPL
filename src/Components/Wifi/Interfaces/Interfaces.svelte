<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let interfaces;
    ipcRenderer.send('get-wifi-interfaces');
    ipcRenderer.on('get-wifi-interfaces', (e, wifiInfo) => {
        interfaces = wifiInfo;
    });
</script>

<Shell title={"AVAILABLE WIFI INTERFACES"} tooltip={"List of available wifi interfaces"}>
    <div class="text-gray-50">
    {#if interfaces}
        {#if interfaces.length > 0}
            {#if interfaces.length > 1}
                {#each interfaces as {id}, _id}
                <p>{_id+1}. <span class="font-bold text-lg">{id}</span></p>
                {/each}
            {:else}
                <p>ID: <span class="font-bold text-lg">{interfaces.id}</span></p>
            {/if}   
        {:else}
            <p>Couldn't find any interfaces.</p>
        {/if}
    {:else}
        <p>Fetching Required Info...</p>
    {/if}
    </div>
</Shell>
