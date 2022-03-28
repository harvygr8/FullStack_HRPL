<script>
    import Link from './Link.svelte';
    import { settings } from '../../Stores/settingsStore';
</script>

<div
    class="w-auto px-4 sticky top-0"
    id="nav"
    style="background-color: {$settings.bgColor1};"
>
    <h2
        class="text-center text-2xl mt-8 font-medium"
        style="color: {$settings.fontColor1};"
    >
    <!-- <i class="fa fa-tachometer fa-2x" aria-hidden="true"></i> -->
    <!-- <i class="fa fa-th fa-2x" aria-hidden="true"></i> -->
    <i class="fa fa-database fa-2x" aria-hidden="true"></i>
    <p class="text-center text-xl mt-2 font-semibold">{$settings.username}</p>

        <!-- {$settings.username} -->
    </h2>
    <div class="mt-8"></div>
    <Link link={'#/'} icon={'fa-home'} name={'Home'} />
    <Link link={'#/network'} icon={'fa-plug'} name={'Network'} />
    <Link link={'#/diagnostics'} icon={'fa-cubes'} name={'Diagnostics'} />
    <!-- <Link link={'#/wifi'} icon={'fa-wifi'} name={'WI-FI'} /> -->
    <Link link={'#/system'} icon={'fa-microchip'} name={'System'} />
    <Link link={'#/api'} icon={'fa-terminal'} name={'API'} />
    <Link link={'#/settings'} icon={'fa-cog'} name={'Settings'} />
</div>
