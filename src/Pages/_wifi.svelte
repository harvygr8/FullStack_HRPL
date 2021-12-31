<script>
    //Svelte
    import Page from './_page.svelte';
    import Info from '../Components/Wifi/Info/Info.svelte';
    import Ssid from '../Components/Wifi/Ssid/Ssid.svelte';
    import Interfaces from '../Components/Wifi/Interfaces/Interfaces.svelte';
</script>

<Page _currPage = "Wi-Fi">
    <div class="p-6 grid grid-cols-1 gap-4">
        <Info />
        <!-- <Ssid />
        <Interfaces /> -->
    </div>
</Page>
