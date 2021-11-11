<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let whois , ip;
    //ipcRenderer.send('get-whois-info');

    function sendData()
    {
      ipcRenderer.send('get-whois-info',ip);
      ipcRenderer.on('get-whois-info', (e, whoisInfo) => {
          whois = whoisInfo;
      });
    }
</script>

<Shell title={"WHOIS LOOKUP"} tooltip={"Check WHOIS"}>
  <div class="flex flex-col">
    <div class="flex flex-row justify-start mt-1">
    <input type="text" placeholder="Enter IP" bind:value={ip} class="rounded-md m-2 px-1 text-gray-800 font-bold">
    <button type="button" on:click={sendData} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-blue-600">SEARCH</button>
    </div>
    <div class="flex flex-col items-start text-gray-50">
    {#if whois}
        <p>Range: <span class="font-bold text-lg">{whois.range}</span></p>
        <p>Organization : <span class="font-bold text-lg">{whois.organisation.OrgName}</span></p>
        <p>City: <span class="font-bold text-lg">{whois.organisation.City}</span></p>
        <p>Country: <span class="font-bold text-lg">{whois.organisation.Country}</span></p>
        <p>Updated on: <span class="font-bold text-lg">{whois.organisation.Updated}</span></p>

    {:else}
    <p>Range: N/A</p>
    <p>Organization : N/A</p>
    <p>City: N/A</p>
    <p>Country: N/A</p>
    <p>Updated on: N/A</p>
    {/if}
    </div>
  </div>
</Shell>
