<script>
    import Nav from '../Components/Misc/Nav.svelte';
    import TitleBar from '../Components/Misc/TitleBar.svelte';
    import { settings } from '../Stores/settingsStore';
</script>

<main 
    class="h-screen" 
    style="font-family: {$settings.font};"
>
    <div class="flex flex-row h-full">
        <Nav />
        <div 
            class="w-full" 
            style="background-color: {$settings.bgColor1};"
        >
            <TitleBar />
            <div class="page-container p-4 mx-auto">
                <slot />
            </div>
        </div>
    </div>
</main>

<style>
    .page-container {
        max-width: 1024px;
    }
</style>