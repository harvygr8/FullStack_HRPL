<script>
    import Nav from '../Components/Misc/Nav.svelte';
    import Shell from '../Components/Misc/Shell.svelte';
</script>

<main class="flex flex-row">
    <Nav />
    <div class="w-full bg-gray-900">
        <h1 class="text-white">Home Page</h1>
        <Shell title={"regex"} tooltip={"Hello WOlrd"}>
            <p>Component on Main Page</p>
        </Shell>
    </div>
</main>