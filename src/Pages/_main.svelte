<script>
    //Svelte
    import Page from './_page.svelte';
    import { settings } from '../Stores/settingsStore';
    import Greeting from '../Components/Main/Greeting.svelte'

</script>

<Page>
    <!-- <Greeting /> -->
    <!-- <p class = "text-3xl text-white font-bold">Hello {$settings.username}!</p> -->
    <div class="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <!-- <Greeting /> -->
    </div>
</Page>
