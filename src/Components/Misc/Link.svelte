<script>
    //Svelte
    import { settings } from '../../Stores/settingsStore';

    //Exports
    export let link = '#/';
    export let icon = 'fa-home';
    export let name = 'Home';
</script>

<style>
a:hover {
  color: #8B5CF6;
  /* font-weight:bold; */
}

</style>

<div
    class="text-lg my-8"
    style="color: {$settings.fontColor1}"
>
    <a href={link}>
        <div
          class="rounded p-2 flex flex-row items-center"
          style="background:{$settings.bgColor3}"
        >
            <i class="fa {icon} text-center w-full md:w-8" />
            <span class="hidden md:block pl-2">
                {name}
            </span>
        </div>
    </a>
</div>
