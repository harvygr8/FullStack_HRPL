<script>
    //Svelte
    import Page from './_page.svelte';
    import PasswordStrength from '../Components/Diagnostics/PasswordStrength/PasswordStrength.svelte';
    import NetworkSpeed from '../Components/Diagnostics/NetworkSpeed/NetworkSpeed.svelte';
    import Info from '../Components/Wifi/Info/Info.svelte';

</script>

<Page _currPage="Diagnostics">
    <div class="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Info />
        <PasswordStrength />
        <NetworkSpeed />
    </div>
</Page>
