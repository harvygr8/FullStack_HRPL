<script>
    //Svelte
    import { onMount } from 'svelte';
    import Nav from '../Components/Misc/Nav.svelte';
    import TitleBar from '../Components/Misc/TitleBar.svelte';
    import { settings } from '../Stores/settingsStore';

    export let _currPage="Home";

    // Add rounded borders when not in fullscreen
    // Remove any borders when in fullscreen
    // Removing this feature for now
    // const addRoundedBorders = () => {
    //     if (screen.width !== window.innerWidth) {
    //         document.getElementById('nav').classList.add('rounded-l-3xl');
    //         document.getElementById('main').classList.add('rounded-r-3xl');

    //         document.getElementById('nav').classList.remove('rounded-none');
    //         document.getElementById('main').classList.remove('rounded-none');
    //     }
    //     else {
    //         document.getElementById('nav').classList.add('rounded-none');
    //         document.getElementById('main').classList.add('rounded-none');

    //         document.getElementById('nav').classList.remove('rounded-l-3xl');
    //         document.getElementById('main').classList.remove('rounded-r-3xl');
    //     }
    // };

    // onMount(() => {
    //     window.addEventListener('load', addRoundedBorders);
    //     window.addEventListener('resize', addRoundedBorders);

    //     return () => {
    //         window.removeEventListener('load', addRoundedBorders);
    //         window.removeEventListener('resize', addRoundedBorders);
    //     }
    // });
</script>

<!-- Editing Here -->
<main
    class="h-full"
    style="font-family: {$settings.font};"
>
    <div class="flex flex-row h-full">
        <Nav />
        <div
            class="w-full h-full"
            id="main"
            style="background-color: {$settings.bgColor1};"
        >
            <TitleBar currPage={_currPage}/>
            <div class="px-4 mx-auto overflow-auto content-height">
                <slot />
            </div>
        </div>
    </div>
</main>

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

    /* Content height */
    .content-height {
        height: 90%;
    }
</style>
