<script>
	import Router from 'svelte-spa-router';
	import Main from './Pages/_main.svelte';
	import Network from './Pages/_network.svelte';
	import Diagnostics from './Pages/_diagnostics.svelte';
	import Wifi from './Pages/_wifi.svelte';
	import System from './Pages/_system.svelte';
	import Api from './Pages/_api.svelte';
	import Settings from './Pages/_settings.svelte';
</script>

<Router routes={{
	'/': Main,
	'/network': Network,
	'/diagnostics': Diagnostics,
	'/wifi': Wifi,
	'/system': System,
	'/api': Api,
	'/settings': Settings
}} />

<style>
	/* :global(*) {
		font-family: 'Roboto', sans-serif;
	} */
</style>
