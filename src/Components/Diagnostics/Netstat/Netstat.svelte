<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let netstat;

    ipcRenderer.send('get-netstat-info');
    ipcRenderer.on('get-netstat-info', (e, netstatInfo) => {
        netstat = netstatInfo;
    });

</script>

<Shell title={"NETSTAT"} tooltip={"List all current connections"}>
    <div class="text-gray-50">
        <div>
            {#if netstat}
                {#if netstat.length > 1}
                    {#each netstat as ns}
                    <p>Interface: <span class="font-bold text-lg">{ns.interface}</span></p>
                    <p>Input Bytes: <span class="font-bold text-lg">{ns.inputBytes}</span></p>
                    <p>Output Bytes: <span class="font-bold text-lg">{ns.outputBytes}</span></p>
                    {/each}
                {:else}
                    <p>Interface: <span class="font-bold text-lg">{netstat[0].interface}</span></p>
                    <p>Input Bytes: <span class="font-bold text-lg">{netstat[0].inputBytes}</span></p>
                    <p>Output Bytes: <span class="font-bold text-lg">{netstat[0].outputBytes}</span></p>
                {/if}
            {:else}
                <p><span class="font-bold text-lg">Error: Couldn't list connections</span></p>
            {/if}
        </div>
    </div>
</Shell>
