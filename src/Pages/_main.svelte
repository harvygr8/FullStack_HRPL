<script>
    //Svelte
    import Page from './_page.svelte';
    import { settings } from '../Stores/settingsStore';
    import Greeting from '../Components/Main/Greeting.svelte'

</script>

<Page>
    <!-- <Greeting /> -->
    <!-- <p class = "text-3xl text-white font-bold">Hello {$settings.username}!</p> -->
    <div class="grid grid-cols-2 gap-4">
      <!-- <Greeting /> -->
    </div>
</Page>
