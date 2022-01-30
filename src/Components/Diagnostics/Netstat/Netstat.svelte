<script>

    //Svelte
    import Shell from '../../Misc/Shell.svelte';

    //Electron
    const { ipcRenderer } = require('electron');


    let netstat;

    ipcRenderer.send('get-netstat-info');
    ipcRenderer.on('get-netstat-info', (e, netstatInfo) => {
        netstat = netstatInfo;
        console.log(netstat);
    });

</script>

<Shell title={"NETSTAT"} tooltip={"List all current connections"}>
    <div class="text-gray-50">
        <div class = "h-64 overflow-x-hidden">

            <div class="flex flex-col">
            <div class="overflow-x-hidden sm:-mx-6 lg:-mx-8">
              <div class="py-1 inline-block min-w-full sm:px-6 lg:px-8">
                {#if netstat}
                  <table class="">

                    <thead class="bg-gray border-b">
                      <tr>
                        <th scope="col" class="text-sm font-medium px-5 py-1">
                          Type
                        </th>
                        <th scope="col" class="text-sm font-medium px-5 py-1">
                          Local IP
                        </th>
                        <th scope="col" class="text-sm font-medium px-5 py-1">
                          Foriegn IP
                        </th>
                        <th scope="col" class="text-sm font-medium px-5 py-1">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {#each netstat as ns}

                      <tr class="bg-gray border-b">
                        <td class="px-5 py-1 whitespace-nowrap text-sm font-medium text-center">
                          {ns.proto}
                        </td>
                        <td class=" px-5 py-1 text-sm font-light whitespace-nowrap text-center">
                          {ns.localip}
                        </td>
                        <td class=" px-5 py-1 text-sm font-light whitespace-nowrap text-center">
                          {ns.foriegnip}
                        </td>
                        <td class=" px-5 py-1 text-sm font-light whitespace-nowrap text-center">
                          {ns.state}
                        </td>
                      </tr>

                      {/each}

                    </tbody>

                  </table>
                  {/if}
              </div>
            </div>
          </div>

              <!-- <table class="">
                <tr class="">
                  <th class="border-2">Type</th>
                  <th class="border-2">Incoming IP</th>
                  <th class="border-2">Foreign IP</th>
                  <th class="border-2">Status</th>
                </tr>
                {#each netstat as ns}
                <tr class="border-2 h-16">
                  <td class="border-2"><p class="p-2">{ns.proto}</p></td>
                  <td class="border-2"><p class="p-2">{ns.localip}</p></td>
                  <td class="border-2"><p class="p-2">{ns.foriegnip}</p></td>
                  <td class="border-2"><p class="p-2">{ns.state}</p></td>
                </tr>
                {/each}
              </table> -->
        </div>
    </div>
</Shell>
