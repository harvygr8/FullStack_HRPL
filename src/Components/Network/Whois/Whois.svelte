<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let whois , ip;
    //ipcRenderer.send('get-whois-info');

    const sendData=()=>{
      ipcRenderer.send('get-whois-info',ip);
      ipcRenderer.on('get-whois-info', (e, whoisInfo) => {
          whois = whoisInfo;
          console.log(whois);
      });
    };
</script>

<Shell title={"Whois Lookup"} tooltip={"Check WHOIS"}>
  <div class="flex flex-col">
    <div class="flex flex-row justify-start">
    <input type="text" placeholder="Enter IP" bind:value={ip} class="w-10/12 rounded-md m-2 px-1 text-gray-800 font-bold">
    <button type="button" on:click={sendData} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600">SEARCH</button>
    </div>
    <div class="flex flex-col items-start text-gray-50">
    {#if whois}
        <p>&#9670 Registrar URL</p>
        <span class="ml-6 font-bold text-lg">{whois.url}</span>
        <p>&#9670 Region</p>
        <span class="ml-6 font-bold text-lg">{whois.st},{whois.cn}</span>
        <p>&#9670 Domain Expiry On</p>
         <span class="ml-6 font-bold text-lg">{whois.expiry}</span>

    {:else}
    <p>&#8226; Registrar URL</p>
    <span class="ml-6 font-bold text-lg">N/A</span>
    <p>&#8226; Region</p>
    <span class="ml-6 font-bold text-lg">N/A , N/A</span>
    <p>&#8226; Domain Expiry On</p>
    <span class="ml-6 font-bold text-lg">N/A</span>
    {/if}
    </div>
  </div>
</Shell>
