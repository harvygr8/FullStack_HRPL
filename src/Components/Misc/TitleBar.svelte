<script>
    import { settings } from '../../Stores/settingsStore';
    
    const { remote } = require("electron");
    const window = remote.getCurrentWindow();
</script>

<div 
    class="flex flex-row justify-between items-center my-2" 
    style="color: {$settings.fontColor2}"
>
    <div class="drag" />
    <div class="drag">
        <h1 class="text-xl">
            Neuron
        </h1>
    </div>
    <div class="flex flex-row justify-center items-center text-md">
        <button on:click={() => window.minimize()} class="fa fa-window-minimize " />    
        <button on:click={() => window.maximize()} class="fa fa-window-maximize mx-6" />    
        <button on:click={() => window.close()} class="fa fa-times mr-4" />    
    </div>
</div>

<style>
    .drag {
        -webkit-user-select: none;
        -webkit-app-region: drag;
    }
</style>
