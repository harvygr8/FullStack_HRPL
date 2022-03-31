<script>
    //Svelte
    import Shell from '../../Misc/Shell.svelte';
    import Loader from '../../Misc/Loader.svelte'
    import { settings } from '../../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');


    let proc;
    ipcRenderer.send('get-proc-info');
    ipcRenderer.on('get-proc-info', (e, procInfo) => {
        proc = procInfo;
        console.log(proc);
    });
</script>

<Shell
    title={"Process List"}
    tooltip={"Information about running processes"}
>

    <div class="pl-2 flex flex-row items-start text-gray-50 overflow-auto">
    {#if proc}
      {#each proc as {pid,name,priority,started}}
        <div class="bg-purple-500 rounded-md flex flex-col items-start m-2 mb-4 p-3">
            <p class="truncate">PID: <span class="font-semibold text-md">{pid}</span></p>
            <p class="font-semibold text-lg truncate">{name}</p>
            <p class="truncate">Priority: <span class="font-semibold text-md">{priority}</span></p>
            <p class="truncate">Started On: <span class="font-semibold text-md">{started}</span></p>
        </div>
      {/each}
    {:else}
    <div class="flex flex-row justify-center">
      <Loader />
    </div>
    {/if}

</Shell>

<style>
  /* Scrollbar styling */
  ::-webkit-scrollbar {
      width: 12px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
      background: #374151;
      margin-top: 24px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
      background: #8B5CF6;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
      background: #6241ad;
  }

</style>
