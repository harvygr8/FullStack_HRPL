<script>
    //Svelte
    import { settings } from '../../Stores/settingsStore';

    //Electron
    const { ipcRenderer } = require('electron');



</script>


    <div style="background-color:{$settings.linkColor}" class="p-1 rounded-md w-auto">
        <div class="flex flex-row justify-center">
        <p class = "text-3xl text-white font-bold">Hello {$settings.username}!</p>
        </div>
    </div>
