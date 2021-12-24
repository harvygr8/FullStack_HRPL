<script>
    import Link from './Link.svelte';
    import { settings } from '../../Stores/settingsStore';
</script>

<div 
    class="w-auto h-full px-2 md:px-4" 
    style="background-color: {$settings.bgColor2};" 
>
    <h2 
        class="text-center text-2xl mt-8 font-medium" 
        style="color: {$settings.fontColor1};"
    >
        {$settings.username}
    </h2>
    <Link link={'#/'} icon={'fa-home'} name={'Home'} />
    <Link link={'#/network'} icon={'fa-plug'} name={'Network'} />
    <Link link={'#/diagnostics'} icon={'fa-cubes'} name={'Diagnostics'} />
    <Link link={'#/wifi'} icon={'fa-wifi'} name={'Wi-Fi'} />
    <Link link={'#/system'} icon={'fa-microchip'} name={'System'} />
    <Link link={'#/api'} icon={'fa-terminal'} name={'Api'} />
    <Link link={'#/settings'} icon={'fa-cog'} name={'Settings'} />
</div>