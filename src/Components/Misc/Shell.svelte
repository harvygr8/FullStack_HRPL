<script>
    export let title = 'Title';
    export let tooltip = 'This is a shell component';
</script>

<div class="rounded-md shadow-md bg-gray-700 p-2">
    <div class="flex flex-row justify-between items-center mb-1">
        <h2 class="text-md text-gray-50 font-bold">{title}</h2>
        <span class="fas fa-info-circle text-gray-50 hover:text-gray-300 cursor-pointer" title="{tooltip}">
        </span>
    </div>
    <div>
        <slot>
            <p>Component Body</p>
        </slot>
    </div>
</div>