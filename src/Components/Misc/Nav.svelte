<script>
    let isVisible = false;
</script>

<nav class="w-max h-screen p-2 bg-gray-800 text-gray-50">
    {#if isVisible}
        <div class="flex flex-row justify-center">
            <h2 class="rounded-md p-2 text-xl font-bold mr-4 ">MENU &nbsp&nbsp<span on:click={() => isVisible = !isVisible} class="fa fa-times-circle-o fa-sm cursor-pointer hover:text-red-500"></span></h2>
            <!-- <span on:click={() => isVisible = !isVisible} class="fa fa-times-circle-o fa-lg cursor-pointer hover:text-red-500"></span> -->
        </div>
        <!-- <hr class="mb-2 mt-2"> -->
        <div class="mt-4 h-custom flex flex-col justify-between items-start">
            <div class="w-auto flex flex-col text-sm py-2">
                <a href="#/" class="rounded-md p-2 font-bold mb-1 hover:text-gray-300 bg-gray-600">HOME</a>
                <!-- <span class ="mb-6" > -->
                  <a href="#/network" class="rounded-md p-2 font-bold mb-1 hover:text-gray-300 bg-gray-600">NETWORK TOOLS</a>
                <!-- <span class ="mb-2"> -->
                <!-- <a href="#/diagnostics" class="rounded-md p-2 font-bold mb-1 hover:text-gray-300 bg-gray-600"><i class="fa fa-database fa-3x"></a> -->
                <!-- <p class ="mb-2"> -->
                <a href="#/pentesting" class="rounded-md p-2 font-bold mb-1 hover:text-gray-300 bg-gray-600">PENTESTING</a>
                <!-- <p class ="mb-2"> -->
                <a href="#/wifi" class="rounded-md p-2 font-bold mb-1 hover:text-gray-300 bg-gray-600">WIFI TOOLS</a>
                <!-- <p class ="mb-2"> -->
                <a href="#/system" class="rounded-md p-2 font-bold mb-1 hover:text-gray-300 bg-gray-600">SYSTEM MONITORING</a>
                <!-- <p class ="mb-2"> -->
                <a href="#/settings" class="rounded-md p-2 font-bold hover:text-gray-300 bg-gray-600">SETTINGS</a>
            </div>
            <!-- <div class="py-2">
                <a href="#/" class="text-md">Logout
                    <span class="fas fa-sign-out-alt text-gray-50 text-xl ml-2 cursor-pointer hover:text-gray-300"></span>
                </a>
            </div> -->
        </div>
    {:else}
        <span on:click={() => isVisible = !isVisible} class="fa fa-bars fa-lg text-gray-50 text-xl cursor-pointer hover:text-green-500"></span>
    {/if}
</nav>

<style>
    .h-custom {
        height: 95%;
    }
</style>
