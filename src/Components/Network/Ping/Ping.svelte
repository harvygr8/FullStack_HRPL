<script>

    //Svelte
    import { onMount, onDestroy } from 'svelte';
    import Shell from '../../Misc/Shell.svelte';
    import { settings } from '../../../Stores/settingsStore'

    //Logex
    import {logToText,logSimple,fileStamp} from '../../../Logex/Logex.js'

    //Electron
    const { ipcRenderer } = require('electron');


    let ping , name, pingInterval, timeList = [], pingChart, isChartVisible = true;
    let logged=true;
    let packetCount=0;

    const stopTool=()=>{
      //packetCount=0;
      clearInterval(pingInterval);
    }

    const sendData=()=>{
      packetCount=0;
      name = document.getElementById("dname").value;
      pingInterval = setInterval(()=>{
        logged=false;
        ipcRenderer.send('get-ping-info',name);
        ipcRenderer.on('get-ping-info', (e, pInfo) => {
            ping = pInfo;
            if(!logged){
              packetCount +=1;
              timeList = [...timeList, ping.time];
              //console.log(timeList);
              //console.log(''+ping.time);

            logToText({
              path:`./logs/clean_logs/PING_${fileStamp}_${ping.hst}.txt`,
              content:`Time:${ping.time} ms | Alive:${ping.alive} | Loss:${ping.loss}`,
              mark:'info',
              quiet:false
            });

            logSimple('./logs/api_logs/PingLog.txt',''+ping.time);


            // Create new chart each time ping data is received
            const canvas = document.getElementById('ping-chart');
            const ctx = canvas.getContext('2d');

            if (pingChart) pingChart.destroy();
            pingChart = new Chart(ctx , {
              type: 'line',
              options: {
                maintainAspectRatio: false,
                color: $settings.fontColor2,
                scales: {
                  x: {
                    ticks: {
                      color: $settings.fontColor2
                    }
                  },
                  y: {
                    ticks: {
                      color: $settings.fontColor2
                    }
                  }
                }
              },
              data: {
                labels: timeList.map((item, index) => index),
                datasets: [{
                    label: 'Ping Chart',
                    data: timeList,
                    borderColor: $settings.miscColor,
                    backgroundColor: $settings.miscColor,
                    tension: 0.1
                }]
              }
            })



            logged=true;
          }
        });
      },1000);
    };

    onMount(() => {
      // setInterval(()=>{
        const canvas = document.getElementById('ping-chart');
        const ctx = canvas.getContext('2d');

        // Create chart for Ping on initial mount
        // If chart already exists, destroy it first
        if (pingChart) pingChart.destroy();
        pingChart = new Chart(ctx , {
            type: 'line',
            options: {
              maintainAspectRatio: false,
              color: $settings.fontColor2,
              scales: {
                x: {
                  ticks: {
                    color: $settings.fontColor2
                  }
                },
                y: {
                  ticks: {
                    color: $settings.fontColor2
                  }
                }
              }
            },
            data: {
                labels: timeList.map((item, index) => index),
                datasets: [{
                    label: 'Ping Chart',
                    data: timeList,
                    borderColor: $settings.miscColor,
                    backgroundColor: $settings.miscColor,
                    tension: 0.1
                }]
            }
        })
    });

    onDestroy(() => {
      packetCount=0;
      timeList = [];
      console.log('Component Unmounted');
      clearInterval(pingInterval);
      pingChart.destroy()
    });

    const clearData = () => {
      clearInterval(pingInterval);
      ping = null;
      timeList = [];
    }
</script>

<Shell title={"PING TOOL"} tooltip={"Check PING Timings"}>
  <div class="flex flex-col">
    <div class="flex flex-row justify-start mt-1">
    <input id="dname" type="text" placeholder="Enter IP/Domain" value="" class="w-3/5 rounded-md m-2 px-1 text-gray-800 font-bold">
    <button type="button" on:click={sendData} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600">START</button>
    <button type="button" on:click={stopTool} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600">STOP</button>
    <button type="button" on:click={() => isChartVisible = !isChartVisible} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600">{isChartVisible ? 'SHOW STATS' : 'SHOW GRAPH'}</button>
    <button type="button" on:click={clearData} class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600">CLEAR DATA</button>
    </div>
    <div class="mt-2 flex flex-col items-center text-gray-50">
    {#if ping}
    {#if !isChartVisible}
    <div class='flex flex-row'>


    <div class='p-4 m-2 flex flex-col justify-center items-center'>
      <p class='text-white font-thin text-lg text-xl'>Host</p>
        <div class='flex flex-row'>
          <p class='font-bold text-white text-3xl'>{ping.hst}</p>&nbsp
          <p class='font-bold text-white text-sm'></p>
        </div>
    </div>

    <div class='p-4 m-2 flex flex-col justify-center items-center'>
      <p class='text-white font-thin text-lg text-xl'>Sent</p>
        <div class='flex flex-row'>
          <p class='font-bold text-white text-3xl'>{packetCount}</p>&nbsp
        </div>
    </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Time</p>
            <div class='flex flex-row'>
              <p class='font-bold text-white text-3xl'>{ping.time}</p>&nbsp
              <p class='font-bold text-white text-3xl'>ms</p>
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Alive</p>
            <div class='flex flex-row'>
              <p class='font-bold text-white text-3xl' style="text-transform: capitalize;">{ping.alive}</p>&nbsp
              <p class='font-bold text-white text-3xl'></p>
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Loss</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>{ping.loss}</p>&nbsp
              <p class='font-bold text-white text-sm'></p>
            </div>
        </div>

      </div>
      {/if}
      <div class="w-11/12 h-36 {isChartVisible ? 'block' : 'hidden'}">
          <canvas id="ping-chart" />
      </div>
<!-- <p>Alive : {ping.alive}</p> -->

    {:else}
        {#if !isChartVisible}
        <div class='flex flex-row'>
        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Host</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>N/A</p>&nbsp
              <p class='font-bold text-white text-sm'></p>
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Sent</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>N/A</p>&nbsp
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Time</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>N/A</p>&nbsp
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Alive</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>N/A</p>&nbsp
              <p class='font-bold text-white text-3xl'></p>
            </div>
        </div>

        <div class='p-4 m-2 flex flex-col justify-center items-center'>
          <p class='text-white font-thin text-lg text-xl'>Loss</p>
            <div class='flex flex-row'>
              <p id="infoValueCPN" class='font-bold text-white text-3xl'>N/A</p>&nbsp
              <p class='font-bold text-white text-sm'></p>
            </div>
        </div>
    </div>
    {/if}
    <div class="w-11/12 h-36 {isChartVisible ? 'block' : 'hidden'}">
        <canvas id="ping-chart" />
    </div>
    {/if}
    </div>
  </div>
</Shell>
