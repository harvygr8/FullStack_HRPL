<script>
    // import NavHorizontal from '../Components/Misc/NavHorizontal.svelte';
    import Nav from '../Components/Misc/Nav.svelte';
    import TitleBar from '../Components/Misc/TitleBar.svelte'
    import Info from '../Components/Wifi/Info/Info.svelte';
    import Ssid from '../Components/Wifi/Ssid/Ssid.svelte';
    import Interfaces from '../Components/Wifi/Interfaces/Interfaces.svelte';
</script>

<!-- <TitleBar /> -->
<main class="flex flex-row">
<Nav />
    <div class="w-screen h-screen bg-gray-900">
    <!-- <NavHorizontal /> -->
        <div class="container mx-auto">
        <TitleBar />
          <!-- <NavHorizontal /> -->
            <!-- <h1 class="rounded-md shadow-md text-left text-2xl font-bold text-gray-50 mb-4 bg-purple-500 pl-2 p-2">SYSTEM MONITOR</h1> -->
            <div class="p-6 grid grid-cols-2 gap-4">
                <Info />
                <Ssid />
                <Interfaces />
            </div>
        </div>
    </div>
</main>
