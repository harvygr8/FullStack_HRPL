<script>
	import Router from 'svelte-spa-router';
	import Main from './Pages/_main.svelte';
	import Network from './Pages/_network.svelte';
	import Diagnostics from './Pages/_diagnostics.svelte';
	import Pentesting from './Pages/_pentesting.svelte';
	import Wifi from './Pages/_wifi.svelte';
	import System from './Pages/_system.svelte';
	import Settings from './Pages/_settings.svelte';
</script>

<Router routes={{
	'/': Main,
	'/network': Network,
	'/diagnostics': Diagnostics,
	'/pentesting': Pentesting,
	'/wifi': Wifi,
	'/system': System,
	'/settings': Settings
}} />

<style>
	:global(*) {
		font-family: 'Roboto', sans-serif;
	}
</style>