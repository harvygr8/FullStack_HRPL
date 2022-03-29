<script>
    //Svelte
    import Page from './_page.svelte';
    import PasswordStrength from '../Components/Diagnostics/PasswordStrength/PasswordStrength.svelte';
    import NetworkSpeed from '../Components/Diagnostics/NetworkSpeed/NetworkSpeed.svelte';
    import Netstat from '../Components/Diagnostics/Netstat/Netstat.svelte';
    import LocalDevices from '../Components/Diagnostics/ArpLD/LocalDevices.svelte';

</script>

<Page _currPage="Diagnostics">
    <div class="p-6 pt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Netstat />
        <LocalDevices />
        <PasswordStrength />
        <NetworkSpeed />
    </div>
</Page>
