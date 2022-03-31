<script>
    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');


    let nx;
    setInterval(()=>{
    ipcRenderer.send('get-nx-info');
  },1000);

    // ipcRenderer.send('get-nx-info');
    ipcRenderer.on('get-nx-info', (e, nxInfo) => {
        nx = nxInfo;
    });
</script>

<Shell
    title={"Network Status"}
    tooltip={"Network stats for the default interface"}
>
    {#if nx}
    <div class="pl-2 flex flex-col items-start text-gray-50">
        <p>&#8226; Interface:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{nx.iface}</span> </p>
        <p>&#8226; Received Bytes:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{nx.rx}</span> </p>
        <p>&#8226; Received Dropped:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{nx.rxd}</span> </p>
        <p>&#8226; Received Errors:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{nx.rxe}</span> </p>
        <p>&#8226; Trasnmitted Bytes:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{nx.tx}</span> </p>
        <p>&#8226; Transmitted Dropped:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{nx.txd}</span> </p>
        <p>&#8226; Transmitted Errors:<span class="ml-2 font-semibold text-lg" style="color: {$settings.fontColor2}">{nx.txe}</span> </p>



    </div>
    {:else}
    <div class="flex flex-row justify-center">
      <Loader />
    </div>
    {/if}

</Shell>
