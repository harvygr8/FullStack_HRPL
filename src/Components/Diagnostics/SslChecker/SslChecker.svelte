<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let ssl, host = '';
    
    const getSslInfo = () => {
        ipcRenderer.send('get-ssl-info', host);
        ipcRenderer.on('get-ssl-info', (e, sslInfo) => {
            ssl = sslInfo;
        });
        host = '';
    }
</script>

<Shell title={"SSL CHECKER"} tooltip={"SSL Certificate checker"}>
    <div class="text-gray-50">
        <div class="flex flex-row">
            <input class="text-black" type="text" bind:value={host} placeholder="Domain Name">
            <button on:click={getSslInfo} type="button">Search</button>
        </div>
        <div>
            {#if ssl}
                {#if !ssl.err}
                    <p>Days Left: <span class="font-bold text-lg">{ssl.daysRemaining}</span></p>
                    <p>Valid: <span class="font-bold text-lg">{ssl.valid}</span></p>
                    <p>Valid From: <span class="font-bold text-lg">{ssl.validFrom.substring(0, 10)}</span></p>
                    <p>Valid To: <span class="font-bold text-lg">{ssl.validTo.substring(0, 10)}</span></p>
                    <p>Valid For: <span class="font-bold text-lg">{ssl.validFor[0]}</span></p>
                {:else}
                    <p><span class="font-bold text-lg">Error: SSL certificate couldn't be found</span></p>
                {/if}
            {/if}
        </div>
    </div>
</Shell>
