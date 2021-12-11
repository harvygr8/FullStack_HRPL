<script>
    let isVisible = false;
</script>

<nav class="w-max h-screen p-2 bg-gray-800 text-gray-50">
    <!-- {#if isVisible} -->
        <div class="flex flex-row justify-center">
          <div class="w-auto flex flex-col">
            <div class="mt-6 flex flex-row justify-center">
            <p><i class="fa fa-user-circle fa-2x"></i></p>

            <h2 class="text-lg pl-2 mt-1 font-bold">HARVINDER</h2>
            </div>
            <hr class="border-1 mt-6 w-full">
            <!-- <a href="#/settings" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-cog" aria-hidden="true"></i></a> -->
          </div>
            <!-- <div class = "divide-y-8 divide-dashed md:divide-solid"></div> -->
            <!-- <span on:click={() => isVisible = !isVisible} class="fa fa-times-circle-o fa-lg cursor-pointer hover:text-red-500"></span> -->
        </div>
        <!-- <hr class="mb-2 mt-2"> -->
        <div class="mt-6 h-custom flex flex-col justify-between items-start">
            <div class="w-auto flex flex-col text-sm py-2">
            <a href="#/" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-home" aria-hidden="true"></i> HOME</a>
            <!-- <span class ="mb-6" > -->
              <a href="#/network" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-plug" aria-hidden="true"></i> NETWORK TOOLS</a>
            <!-- <span class ="mb-2"> -->
            <a href="#/diagnostics" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-cubes" aria-hidden="true"></i> COLLECTIONS / MISC </a>
            <!-- <p class ="mb-2"> -->
            <a href="#/pentesting" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-terminal" aria-hidden="true"></i> PENTESTING</a>
            <!-- <p class ="mb-2"> -->
            <a href="#/wifi" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-wifi" aria-hidden="true"></i> WIFI TOOLS</a>
            <!-- <p class ="mb-2"> -->
            <a href="#/system" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-microchip" aria-hidden="true"></i> SYSTEM MONITORING</a>
            <!-- <p class ="mb-2"> -->

            <a href="#/settings" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-cog" aria-hidden="true"></i> API DASHBOARD </a>

            <a href="#/settings" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-cog" aria-hidden="true"></i> ACCOUNT SETTINGS </a>

            <a href="#/settings" class="text-center rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-gray-600 text-sm"><i class="fa fa-cog" aria-hidden="true"></i> APP SETTINGS</a>
            </div>
            <!-- <div class="py-2">
                <a href="#/" class="text-md">Logout
                    <span class="fas fa-sign-out-alt text-gray-50 text-xl ml-2 cursor-pointer hover:text-gray-300"></span>
                </a>
            </div> -->
        </div>
    <!-- {:else}
        <span on:click={() => isVisible = !isVisible} class="fa fa-bars fa-lg text-gray-50 text-xl cursor-pointer hover:text-green-500"></span>
    {/if} -->
</nav>

<style>
    .h-custom {
        height: 95%;
    }
</style>
