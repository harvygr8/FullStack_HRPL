<script>
    //Svelte
    import Page from './_page.svelte';
    import { settings } from '../Stores/settingsStore';
    import Greeting from '../Components/Main/Greeting.svelte'

    // Components
    import Netstat from '../Components/Diagnostics/Netstat/Netstat.svelte';
    import NetworkSpeed from '../Components/Diagnostics/NetworkSpeed/NetworkSpeed.svelte';
    import PasswordStrength from '../Components/Diagnostics/PasswordStrength/PasswordStrength.svelte';
    import SslChecker from '../Components/Diagnostics/SslChecker/SslChecker.svelte';
    import Dns from '../Components/Network/Dns/Dns.svelte';
    import IpTools from '../Components/Network/IPTools/IPTools.svelte';
    import NetworkInterfaces from '../Components/Network/NetworkInterfaces/NetworkInterfaces.svelte';
    import Ping from '../Components/Network/Ping/Ping.svelte';
    import Ports from '../Components/Network/Ports/Ports.svelte';
    import Whois from '../Components/Network/Whois/Whois.svelte';
    import Cpu from '../Components/System/Cpu/Cpu.svelte';
    import Speed from '../Components/System/Cpu/Speed.svelte';
    import Disk from '../Components/System/Disk/Disk.svelte';
    import Graphics from '../Components/System/Graphics/Graphics.svelte';
    import OSinfo from '../Components/System/OS/OSinfo.svelte';
    import Ram from '../Components/System/Ram/Ram.svelte';
    import Usage from '../Components/System/Usage/Usage.svelte';
    import Info from '../Components/Wifi/Info/Info.svelte';
    import Interfaces from '../Components/Wifi/Interfaces/Interfaces.svelte';
    import Ssid from '../Components/Wifi/Ssid/Ssid.svelte';
    import LocalDevices from '../Components/Diagnostics/ArpLD/LocalDevices.svelte';

    const components = [
      {
        name: 'Ping Tool',
        component: Ping
      },
      {
        name: 'IP Lookup',
        component: IpTools
      },
      {
        name: 'Available Interfaces',
        component: NetworkInterfaces
      },
      {
        name: 'Local Devices',
        component: LocalDevices
      },
      {
        name: 'DNS Lookup',
        component: Dns
      },
      {
        name: 'Port Scanning',
        component: Ports
      },
      {
        name: 'Netstat',
        component: Netstat
      },
      {
        name: 'SSL Checker',
        component: SslChecker
      },
      {
        name: 'Wifi Information',
        component: Info
      },
      {
        name: 'Password Checker',
        component: PasswordStrength
      },
      {
        name: 'Network Speed',
        component: NetworkSpeed
      },
      {
        name: 'CPU Information',
        component: Cpu
      },
      {
        name: 'Operating System',
        component: OSinfo
      },
      {
        name: 'Ram Monitor',
        component: Ram
      },
      {
        name: 'Graphics Card Data',
        component: Graphics
      },
      {
        name: 'Disk Space',
        component: Disk
      },
      {
        name: 'CPU Utilization',
        component: Usage
      }
    ];

    // Function to check if a component is present in favorites
    function checkInStorage(component) {
      const favorites = localStorage.favorites;
      if (strToArr(favorites).some(item => item === component)) return true;
      else return false;
    }

    // Helper function
    function strToArr(str) {
      if (!str) return [];
      return str.split(',');
    }

</script>

<Page>
    <!-- <Greeting /> -->
    <!-- <p class = "text-3xl text-white font-bold">Hello {$settings.username}!</p> -->
    {#if !localStorage.favorites}
    <div class="flex flex-col justify-center items-center h-full">
      <h2 class="text-lg" style="color: {$settings.fontColor1}">
        You do not have any favourite widgets.
      </h2>
    </div>
    {:else}
    <h2 class="mt-10 text-xl mt-4 px-6" style="color: {$settings.fontColor1}">
      Favourite Widgets
    </h2>
    <div class="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <!-- <Greeting /> -->
      {#each components as {name, component}}
      {#if checkInStorage(name)}
      <svelte:component this={component} />
      {/if}
      {/each}
    </div>

    {/if}
</Page>
