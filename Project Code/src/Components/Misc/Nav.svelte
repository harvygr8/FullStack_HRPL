<script>
    let isVisible = false;
</script>

<nav class="w-max h-screen p-2 bg-gray-800 text-gray-50">
    {#if isVisible}
        <div class="flex flex-row items-center">
            <h2 class="text-xl font-bold mr-2">Neuron</h2>
            <span on:click={() => isVisible = !isVisible} class="fas fa-times text-gray-50 text-xl cursor-pointer hover:text-gray-300"></span>
        </div>
        <div class="h-custom flex flex-col justify-between items-start">
            <div class="flex flex-col items-start text-sm py-2">
                <a href="#/" class="mb-1 hover:text-gray-300">Home</a>
                <a href="#/network" class="mb-1 hover:text-gray-300">Networking</a>
                <a href="#/diagnostics" class="mb-1 hover:text-gray-300">Diagnostics</a>
                <a href="#/pentesting" class="mb-1 hover:text-gray-300">Pentesting</a>
                <a href="#/wifi" class="mb-1 hover:text-gray-300">Wifi</a>
                <a href="#/system" class="mb-1 hover:text-gray-300">System Info</a>
                <a href="#/settings" class=" hover:text-gray-300">Settings</a>
            </div>
            <div class="py-2">
                <a href="#/" class="text-md">Logout
                    <span class="fas fa-sign-out-alt text-gray-50 text-xl ml-2 cursor-pointer hover:text-gray-300"></span>
                </a>
            </div>
        </div>
    {:else}
        <span on:click={() => isVisible = !isVisible} class="fas fa-bars text-gray-50 text-xl cursor-pointer hover:text-gray-300"></span>
    {/if}
</nav>
    
<style>
    .h-custom {
        height: 95%;
    }
</style>