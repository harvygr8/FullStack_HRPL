<script>
    import Nav from '../Components/Misc/Nav.svelte';
    import Cpu from '../Components/System/Cpu/Cpu.svelte';
    import CpuTemps from '../Components/System/CpuTemps/CpuTemps.svelte';
    import Ram from '../Components/System/Ram/Ram.svelte';
</script>

<main class="flex flex-row">
    <Nav />
    <div class="container mx-auto w-full bg-gray-900 p-2">
        <h1 class="text-center text-2xl font-bold text-gray-50 mb-2">System Monitor</h1>
        <div class="grid grid-cols-2 gap-4">
            <Cpu />
            <CpuTemps />
            <Ram />
        </div>
    </div>
</main>