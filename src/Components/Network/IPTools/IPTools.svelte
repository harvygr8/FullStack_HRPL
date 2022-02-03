<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let geo , ip;
    //ipcRenderer.send('get-whois-info');

    const startLookup=()=>{
      //console.log("test");
      ipcRenderer.send('get-geo-info',ip);
      ipcRenderer.on('get-geo-info', (e, geoInfo) => {
          geo = geoInfo;
          console.log(geo);
      });
    };

</script>

<Shell title={"IP LOOKUP"} tooltip={"Get Details about an IP"}>
  <div class="flex flex-col">
    <div class="flex flex-row justify-start">
    <input type="text" placeholder="Enter IP" bind:value={ip} class="w-10/12 rounded-md m-2 px-1 text-gray-800 font-bold">
    <button type="button" on:click={startLookup} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600">LOOKUP</button>
    </div>
    <div class="flex flex-col items-start text-gray-50">
    {#if geo}
        <p>&#9670 Country</p>
        <span class="ml-6 font-bold text-lg">{geo.country}</span>
        <p>&#9670 Region</p>
        <span class="ml-6 font-bold text-lg">{geo.city}</span>
        <p>&#9670 ISP/ORG</p>
         <span class="ml-6 font-bold text-lg">{geo.isp}</span>

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
