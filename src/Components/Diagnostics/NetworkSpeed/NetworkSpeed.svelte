<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'

    //Electron
    const { ipcRenderer } = require('electron');

    let networkSpeed;
    let started=false;
    let err=false;

    const startTest=()=>{
        ipcRenderer.send('get-network-speed');
        started=true;
    };

    ipcRenderer.on('get-network-speed', (e, speedInfo) => {
        networkSpeed = speedInfo;
        if(networkSpeed==null)
        {
          err=true;
        }
        console.log(networkSpeed)
        started=false;
    });

</script>

<Shell title={"NETWORK SPEED"} tooltip={"List network speed"}>
    <div class="flex flex-col justify-center mt-1 text-gray-50">
        <div class ="flex flex-col justify-center items-center mt-1">
            {#if started}
              <!-- <p><span class="font-bold text-lg">Running!</span></p> -->
              <Loader />
              {:else}
                <button type="button" on:click={startTest} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600">START TEST</button>
                <!-- <p><span class="font-bold text-lg">No Tests Running!</span></p> -->
            {/if}
        </div>

        {#if networkSpeed}
          {#if !networkSpeed.err}
            <div class ="flex flex-row justify-center mt-1">
                <div class="flex flex-col items-center text-gray-50 pr-8">
                <p class='text-white font-medium text-lg text-xl'>Speed</p>
                  <div class='flex flex-row'>
                    <p class='font-bold text-white text-2xl'>{networkSpeed.downloadSpeed} Mbps </p>
                  </div>
                </div>

                <div class="flex flex-col items-center text-gray-50 pl-8">
                <p class='text-white font-medium text-lg text-xl'>Time</p>
                  <div class='flex flex-row'>
                    <p class='font-bold text-white text-2xl'>{networkSpeed.totalTime} s</p>
                  </div>
                </div>

              </div>
            {:else}
              <div class ="flex flex-row justify-center mt-1">

                  <div class="flex flex-col items-center text-gray-50 p-4">
                  <p class='text-white font-medium text-lg text-xl'>{networkSpeed.err}</p>
                  </div>

                </div>
            {/if}
          {/if}


</Shell>
