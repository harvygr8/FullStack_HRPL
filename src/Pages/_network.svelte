<script>
    //Svelte
    import Page from './_page.svelte';
    import Ping from '../Components/Network/Ping/Ping.svelte'
    import Whois from '../Components/Network/Whois/Whois.svelte'
    import NetworkInterfaces from '../Components/Network/NetworkInterfaces/NetworkInterfaces.svelte'
    import Dns from '../Components/Network/Dns/Dns.svelte'
    import Ports from '../Components/Network/Ports/Ports.svelte'
</script>

<Page _currPage="Network">
    <div class="p-6 grid grid-cols-2 gap-4">
      <Whois />
      <NetworkInterfaces />
      <Dns />
      <Ports/>
    </div>
    <div class="pl-6 pr-6 grid grid-cols-1 gap-2">
    <Ping />
</Page>
