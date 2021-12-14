<script>
    import { onDestroy } from 'svelte';
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';

    let ping , name, pingInterval;

    function sendData()
    {
      pingInterval = setInterval(()=>{
        ipcRenderer.send('get-ping-info',name);
        ipcRenderer.on('get-ping-info', (e, pInfo) => {
            ping = pInfo;
        });
      },1000);
    }

    onDestroy(() => {
      console.log('Component Unmounted');
      clearInterval(pingInterval);
    });
</script>

<Shell title={"PING TOOL"} tooltip={"Check PING Timings"}>
  <div class="flex flex-col">
    <div class="flex flex-row justify-start mt-1">
    <input type="text" placeholder="Enter IP/Domain" bind:value={name} class="rounded-md m-2 px-1 text-gray-800 font-bold">
    <button type="button" on:click={sendData} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-blue-600">SEARCH</button>
    </div>
    <div class="flex flex-col items-start text-gray-50">
    {#if ping}
    <div class='flex flex-row'>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Time</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>{ping.time}</p>&nbsp
              <p class='font-bold text-white text-3xl'>ms</p>
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Alive</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>{ping.alive}</p>&nbsp
              <p class='font-bold text-white text-3xl'></p>
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Host Address</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>{ping.hst}</p>&nbsp
              <p class='font-bold text-white text-sm'></p>
            </div>
        </div>

      </div>
<!-- <p>Alive : {ping.alive}</p> -->

    {:else}
    <div class='flex flex-row'>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Time</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>N/A</p>&nbsp
              <p class='font-bold text-white text-3xl'>ms</p>
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Alive</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>N/A</p>&nbsp
              <p class='font-bold text-white text-3xl'></p>
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Host Address</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>N/A</p>&nbsp
              <p class='font-bold text-white text-sm'></p>
            </div>
        </div>

      </div>
    {/if}
    </div>
  </div>
</Shell>
