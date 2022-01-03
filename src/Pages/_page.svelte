<script>
    //Svelte
    import Nav from '../Components/Misc/Nav.svelte';
    import TitleBar from '../Components/Misc/TitleBar.svelte';
    import { settings } from '../Stores/settingsStore';

    export let _currPage="Home";
</script>

<main
    class="h-full"
    style="font-family: {$settings.font};"
>
    <div class="flex flex-row h-full">
        <Nav />
        <div
            class="w-full h-full overflow-auto"
            style="background-color: {$settings.bgColor1};"
        >
            <TitleBar currPage={_currPage}/>
            <div class="p-4 mx-auto">
                <slot />
            </div>
        </div>
    </div>
</main>