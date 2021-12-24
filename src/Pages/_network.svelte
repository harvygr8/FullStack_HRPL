<script>
    import Page from './_page.svelte';
    import Ping from '../Components/Network/Ping/Ping.svelte'
    import Whois from '../Components/Network/Whois/Whois.svelte'
    import NetworkInterfaces from '../Components/Network/NetworkInterfaces/NetworkInterfaces.svelte'
    import Dns from '../Components/Network/Dns/Dns.svelte'
</script>

<Page>
    <div class="p-6 grid grid-cols-2 gap-4">
      <Ping />
      <Whois />
      <NetworkInterfaces />
      <Dns />
    </div>
</Page>