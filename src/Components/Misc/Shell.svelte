<script>
    import { settings } from '../../Stores/settingsStore';

    export let title = 'Title';
    export let tooltip = 'This is a shell component';
</script>

<div 
    class="rounded-sm shadow-md p-2 " 
    style="background-color: {$settings.bgColor2}; color: {$settings.fontColor1}"
>
    <div class="flex flex-row justify-between items-center">
        <h3 
            class="text-2xl font-medium" 
            style="color: {$settings.fontColor2};"
        >
            {title}
        </h3>
        <span 
            class="ml-2 fas fa-info-circle cursor-pointer" 
            title="{tooltip}" 
        />
    </div>
    <hr class="my-2">
    <div>
        <slot />
    </div>
</div>
