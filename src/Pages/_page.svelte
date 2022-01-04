<script>
    //Svelte
    import { onMount } from 'svelte';
    import Nav from '../Components/Misc/Nav.svelte';
    import TitleBar from '../Components/Misc/TitleBar.svelte';
    import { settings } from '../Stores/settingsStore';

    export let _currPage="Home";

    // Add rounded borders when not in fullscreen
    // Needs fixing
    const addRoundedBorders = () => {
        if (screen.width !== window.innerWidth) 
                document.getElementById('main').classList.add('rounded-md');
        else
                document.getElementById('main').classList.add('rounded-none');
    };

    onMount(() => {
        window.addEventListener('load', addRoundedBorders);
        window.addEventListener('resize', addRoundedBorders);
        
        return () => {
            window.removeEventListener('load', addRoundedBorders);
            window.removeEventListener('resize', addRoundedBorders);
        }
    });
</script>

<main
    class="h-full" 
    id="main"
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