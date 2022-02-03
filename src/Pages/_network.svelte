<script>
    //Svelte
    import Page from './_page.svelte';
    import Ping from '../Components/Network/Ping/Ping.svelte'
    import IPTools from '../Components/Network/IPTools/IPTools.svelte'
    import NetworkInterfaces from '../Components/Network/NetworkInterfaces/NetworkInterfaces.svelte'
    import Dns from '../Components/Network/Dns/Dns.svelte'
    import Ports from '../Components/Network/Ports/Ports.svelte'
    import SslChecker from '../Components/Diagnostics/SslChecker/SslChecker.svelte';
    import Netstat from '../Components/Diagnostics/Netstat/Netstat.svelte';

</script>

<Page _currPage="Network">
    <div class="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div class="col-span-1 md:col-span-2 xl:col-span-3">
        <Ping />
      </div>
      <IPTools />
      <NetworkInterfaces />
      <Dns />
      <Ports/>
      <Netstat/>
      <SslChecker/>
    </div>
</Page>
