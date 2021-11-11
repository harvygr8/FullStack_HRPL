<script>
    import NavHorizontal from '../Components/Misc/NavHorizontal.svelte';
    import Shell from '../Components/Misc/Shell.svelte';
    import TitleBar from '../Components/Misc/TitleBar.svelte'
    import Ping from '../Components/Network/Ping/Ping.svelte'
    import Whois from '../Components/Network/Whois/Whois.svelte'
</script>


<TitleBar />
<main class="flex flex-row">
    <div class="w-full h-screen bg-gray-900">
    <NavHorizontal />
        <div class="container mx-auto p-2">
            <!-- <h1 class="rounded-md shadow-md text-left text-2xl font-bold text-gray-50 mb-4 bg-purple-500 pl-2 p-2">SYSTEM MONITOR</h1> -->
            <div class="grid grid-cols-2 gap-4">
              <Ping />
              <Whois />
            </div>
        </div>
    </div>
</main>
