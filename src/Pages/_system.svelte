<script>
    import NavHorizontal from '../Components/Misc/NavHorizontal.svelte';
    import TitleBar from '../Components/Misc/TitleBar.svelte'
    import Cpu from '../Components/System/Cpu/Cpu.svelte';
    import OSinfo from '../Components/System/OS/OSinfo.svelte';
    import Ram from '../Components/System/Ram/Ram.svelte';
    import Graphics from '../Components/System/Graphics/Graphics.svelte';
</script>

<TitleBar />
<main class="flex flex-row">
    <div class="w-screen h-screen bg-gray-900">
    <NavHorizontal />
        <div class="container mx-auto">
            <!-- <h1 class="rounded-md shadow-md text-left text-2xl font-bold text-gray-50 mb-4 bg-purple-500 pl-2 p-2">SYSTEM MONITOR</h1> -->
            <div class="grid grid-cols-2 gap-4">
                <Cpu />
                <OSinfo />
                <Ram />
                <Graphics />
            </div>
        </div>
    </div>
</main>
