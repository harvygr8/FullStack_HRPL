<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'

    //Electron
    const { ipcRenderer } = require('electron');

    let cpuSpeed;

    setInterval(()=>{
      ipcRenderer.send('get-cpu-speed');
    },1000);

    //Fixed this
    ipcRenderer.on('get-cpu-speed', (e, speedInfo) => {
        cpuSpeed = speedInfo;
        //console.log(cpuSpeed)
    });

</script>

<Shell title={"CPU SPEED"} tooltip={"List network speed"}>
    <div class="flex flex-col justify-center mt-1 text-gray-50">
        {#if cpuSpeed}
        <div class ="flex flex-row justify-center mt-1">

            <div class="flex flex-col items-center text-gray-50 pr-8">
            <p class='text-white font-thin text-lg text-xl'>Speed (Min)</p>
              <div class='flex flex-row'>
                <p class='font-bold text-white text-2xl'>{cpuSpeed.min} GHz </p>
              </div>
            </div>

            <div class="flex flex-col items-center text-gray-50 pl-8">
            <p class='text-white font-thin text-lg text-xl'>Speed (Max)</p>
              <div class='flex flex-row'>
                <p class='font-bold text-white text-2xl'>{cpuSpeed.max} GHz</p>
              </div>
            </div>

          </div>
            {/if}
</Shell>
