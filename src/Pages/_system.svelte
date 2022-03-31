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
    import Pstop from '../Components/System/Pstop/Pstop.svelte';
</script>

<Page _currPage="System">
    <div class="p-6 pt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Cpu />
          <OSinfo />
          <Graphics />
          <Ram />
          <!-- <Speed /> -->
          <Disk />
          <Usage />
          <div class="col-span-1 md:col-span-2 xl:col-span-3">
            <Pstop/>
          </div>
    </div>
</Page>
