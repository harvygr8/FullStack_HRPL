<script>
    import Nav from '../Components/Misc/Nav.svelte';
    import TitleBar from '../Components/Misc/TitleBar.svelte';
    import PasswordStrength from '../Components/Diagnostics/PasswordStrength/PasswordStrength.svelte';
    import SslChecker from '../Components/Diagnostics/SslChecker/SslChecker.svelte';
    import Netstat from '../Components/Diagnostics/Netstat/Netstat.svelte';
    import NetworkSpeed from '../Components/Diagnostics/NetworkSpeed/NetworkSpeed.svelte';
</script>

<main class="flex flex-row">
<Nav />

<div class="w-full h-screen bg-gray-900">
        <div class="container mx-auto">
        <TitleBar />
            <!-- <h1 class="rounded-md shadow-md text-left text-2xl font-bold text-gray-50 mb-4 bg-purple-500 pl-2 p-2">SYSTEM MONITOR</h1> -->
            <div class="p-6 grid grid-cols-2 gap-4">
                <PasswordStrength />
                <SslChecker />
                <Netstat />
                <NetworkSpeed />
            </div>
        </div>
    </div>
</main>
