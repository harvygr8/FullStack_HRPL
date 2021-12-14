<script>
    export let color = 'bg-gray-200';
    export let length = 0;
</script>

<div class="w-full rounded-md bg-gray-200 h-4">
    <div style="width: {length}%;" class="h-full rounded-sm {color}" />
</div>

<style>
    .bg-orange {
        background-color: orangered;
    }
</style>