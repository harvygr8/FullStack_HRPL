<script>
    import Page from './_page.svelte';    
    import Cpu from '../Components/System/Cpu/Cpu.svelte';
    import OSinfo from '../Components/System/OS/OSinfo.svelte';
    import Ram from '../Components/System/Ram/Ram.svelte';
    import Graphics from '../Components/System/Graphics/Graphics.svelte';
</script>

<Page>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Cpu />
        <OSinfo />
        <Ram />
        <Graphics />
    </div>
</Page>