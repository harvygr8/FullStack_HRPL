<script>
    import { settings } from '../../Stores/settingsStore';

    export let link = '#/';
    export let icon = 'fa-home';
    export let name = 'Home';
</script>

<div 
    class="text-lg my-8" 
    style="color: {$settings.fontColor1}"
>
    <a href={link}>
        <div class="flex flex-row items-center">
            <i class="fa {icon} text-center w-full md:w-8" />
            <span class="hidden md:block pl-4">
                {name}
            </span>
        </div>
    </a>
</div>