<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'

    //Electron
    const { ipcRenderer } = require('electron');


    let port, value = '';
    let search = false;

    const getPortInfo = () => {
        search=true;
        port=null;
        ipcRenderer.send('get-open-ports', value);
        // value = '';
    };

    ipcRenderer.on('get-open-ports', (e, portInfo) => {
        port = portInfo;
        search=false;
    });

</script>

<Shell title={"Port Scanning"} tooltip={"Scan Open Ports"}>
    <div class="text-gray-50">
        <div class="flex flex-row">
        <input type="text" placeholder="Enter IP" bind:value class="w-10/12 rounded-md m-2 px-1 text-gray-800 font-semibold">
            <button on:click={getPortInfo} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600" type="button">Scan</button>
        </div>
        <div class="mt-2 max-h-48 overflow-auto w-full">
            {#if port}
              <p>&#8226; Open Ports</p>
              {#each port as portNumber}
              <span class="ml-8 font-semibold text-lg block">{portNumber}</span>
              {/each}
            {:else if search}
              <!-- <p>&#8226; SEARCHING</p> -->
              <div class="flex flex-row justify-center">
                <Loader />
              </div>
              <!-- {:else if port.err}
                <p>&#8226; porterr</p> -->
            {:else}
            <p>&#8226; Open Ports</p>
            <span class="ml-8 font-semibold text-lg">N/A</span>
            {/if}
        </div>
    </div>
</Shell>
