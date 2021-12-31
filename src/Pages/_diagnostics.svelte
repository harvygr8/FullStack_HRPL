<script>
    //Svelte
    import Page from './_page.svelte';
    import PasswordStrength from '../Components/Diagnostics/PasswordStrength/PasswordStrength.svelte';
    import SslChecker from '../Components/Diagnostics/SslChecker/SslChecker.svelte';
    import Netstat from '../Components/Diagnostics/Netstat/Netstat.svelte';
    import NetworkSpeed from '../Components/Diagnostics/NetworkSpeed/NetworkSpeed.svelte';
</script>

<Page _currPage="Diagnostics">
    <div class="p-6 grid grid-cols-2 gap-4">
        <PasswordStrength />
        <SslChecker />
        <Netstat />
        <NetworkSpeed />
    </div>
</Page>
