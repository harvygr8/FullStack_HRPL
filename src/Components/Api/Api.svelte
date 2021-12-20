<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let data;

    const getApiData = () => {
        isFetching = true;
        ipcRenderer.send('get-api-data');
        ipcRenderer.on('get-api-data', (e, apiData) => {
            data = apiData;
        })
    }
</script>

<Shell title={"NETSTAT"} tooltip={"List all current connections"}>
    <div class="text-gray-50">
        <button on:click|preventDefault={getApiData}>Get Data</button>
        {#if data}
            <p>
                Data received successfully
            </p>
        {/if}
    </div>

</Shell>
