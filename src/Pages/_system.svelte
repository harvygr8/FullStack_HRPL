<script>
    //Svelte
    import Page from './_page.svelte';
    import Cpu from '../Components/System/Cpu/Cpu.svelte';
    import Speed from '../Components/System/Cpu/Speed.svelte';
    import OSinfo from '../Components/System/OS/OSinfo.svelte';
    import Ram from '../Components/System/Ram/Ram.svelte';
    import Graphics from '../Components/System/Graphics/Graphics.svelte';
    import Usage from '../Components/System/Usage/Usage.svelte';
    import Disk from '../Components/System/Disk/Disk.svelte';
</script>

<Page _currPage="System">
    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Cpu />
          <OSinfo />
          <Ram />
          <Graphics />
          <!-- <Speed /> -->
          <Disk />
          <Usage />
    </div>
</Page>
