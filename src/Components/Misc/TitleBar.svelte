<script>
    //Svelte
    import { settings } from '../../Stores/settingsStore';

    //Electron
    const { remote } = require("electron");
    const window = remote.getCurrentWindow();

    //Exports
    export let currPage="Home";
</script>

<div
    class="flex flex-row justify-between my-2 drag w-full sticky top-0"
    style="color: {$settings.fontColor2}; background-color: {$settings.bgColor2}"
>
    <!-- <div class="drag" />
    <div class="drag"> -->
        <h1 class="mt-1 text-xl ml-10 font-semibold uppercase">
        Neuron / <span style="background-color:{$settings.bgColor2}" class="pr-2 pb-1 rounded-md">{currPage}</span>
        </h1>
            <!-- NEURON -->
    <!-- </div> -->
    <div class="flex flex-row justify-center items-center text-md no-drag">
        <button on:click={() => window.minimize()} class="fa fa-window-minimize " />
        <button on:click={() => window.maximize()} class="fa fa-window-maximize mx-6" />
        <button on:click={() => window.close()} class="fa fa-times mr-4" />
    </div>
</div>
<!-- <hr class="mt-2 w-full"> -->


<style>
    .drag {
        -webkit-user-select: none;
        -webkit-app-region: drag;
    }
    .no-drag {
        -webkit-user-select: none;
        -webkit-app-region: none;
    }
</style>
