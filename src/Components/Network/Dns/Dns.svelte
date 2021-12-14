<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let dns, value = '';
    
    const getDnsInfo = () => {
        ipcRenderer.send('get-dns-lookup', value);
        ipcRenderer.on('get-dns-lookup', (e, dnsInfo) => {
            dns = dnsInfo;
        });
        value = '';
    }
</script>

<Shell title={"DNS LOOKUP"} tooltip={"DNS Lookup"}>
    <div class="text-gray-50">
        <div class="flex flex-row">
            <input class="text-black" type="text" bind:value placeholder="Domain Name">
            <button on:click={getDnsInfo} type="button">Search</button>
        </div>
        <div>
            {#if dns}
                {#if !dns.err}
                    <p>IP Address: <span class="font-bold text-lg">{dns.address}</span></p>
                    <p>Family: <span class="font-bold text-lg">{dns.family}</span></p>
                {:else}
                    <p><span class="font-bold text-lg">Error: DNS couldn't be found</span></p>
                {/if}
            {/if}
        </div>
    </div>
</Shell>
