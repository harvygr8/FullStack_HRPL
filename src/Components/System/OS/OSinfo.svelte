<script>
    const { ipcRenderer } = require('electron');
    import Shell from '../../Misc/Shell.svelte';
    import { settings } from '../../../Stores/settingsStore';

    let os;
    ipcRenderer.send('get-os-info');
    ipcRenderer.on('get-os-info', (e, osInfo) => {
        os = osInfo;
    });
</script>

<Shell 
    title={"Operating System"} 
    tooltip={"Information regarding operating system"}
>
    {#if os}
    <div class="grid grid-cols-2 gap-x-2 gap-y-6">
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Platform
            </span>
            <span class="font-medium text-lg">
                {os.platform}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Host Name
            </span>
            <span class="font-medium text-lg">
                {os.hostname}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                Kernel
            </span>
            <span class="font-medium text-lg">
                {os.kernel}
            </span>
        </p>
        <p class="flex flex-col justify-start items-center">
            <span 
                class="text-sm pb-1"
                style="color: {$settings.fontColor2}"
            >
                FQDN
            </span>
            <span class="font-medium text-lg">
                {os.fqdn}
            </span>
        </p>
    </div>
    {:else}
        <p>
            Fetching Required Info...
        </p>
    {/if}
</Shell>
