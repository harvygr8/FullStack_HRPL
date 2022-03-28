<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';

    //Electron
    const { ipcRenderer } = require('electron');


    let ssl, host = '';

    const getSslInfo = () => {
        ipcRenderer.send('get-ssl-info', host);
        ipcRenderer.on('get-ssl-info', (e, sslInfo) => {
            ssl = sslInfo;
        });
        // host = '';
    }
</script>

<Shell title={"SSL Checker"} tooltip={"SSL Certificate checker"}>
    <div class="text-gray-50">
        <div class="flex flex-row">
            <input type="text" placeholder="Enter Domain Name" bind:value={host} class="w-10/12 rounded-md m-2 px-1 text-gray-800 font-semibold">
            <button type="button" on:click={getSslInfo} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600">Search</button>
            <!-- <input class="text-black" type="text" bind:value={host} placeholder="Domain Name">
            <button on:click={getSslInfo} type="button">Search</button> -->
        </div>
        <div>
            {#if ssl}
                {#if !ssl.err}
                    <p class="pt-2 ">&#8226; Days Left</p>
                      <span class="ml-4 font-semibold text-lg">{ssl.daysRemaining}</span>
                    <p class="">&#8226; Valid From</p>
                      <span class="ml-4 font-semibold text-lg">{ssl.validFrom.substring(0, 10)}</span>
                    <p class="">&#8226; Valid To</p>
                      <span class="ml-4 font-semibold text-lg">{ssl.validTo.substring(0, 10)}</span>
                {:else}
                    <p><span class="font-semibold text-lg">Error: SSL certificate couldn't be found</span></p>
                {/if}
            {:else}
              <p class="pt-2">&#8226; Days Left</p>
                <span class="ml-4 font-semibold text-lg">N/A</span>
              <p class="">&#8226; Valid From</p>
                <span class="ml-4 font-semibold text-lg">N/A</span>
              <p class="">&#8226; Valid To</p>
                <span class="ml-4 font-semibold text-lg">N/A</span>
            {/if}
        </div>
    </div>
</Shell>
