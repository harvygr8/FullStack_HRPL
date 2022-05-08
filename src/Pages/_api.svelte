<script>
    //Svelte
    import { onMount } from 'svelte';
    import Page from './_page.svelte';
    import { settings } from '../Stores/settingsStore';
    const fs = require('fs');

    let isChecked = localStorage.checked === "true" ? true : false;
    let isSpeed = localStorage.speed === "true" ? true : false;
    let isLocation = localStorage.location === "true" ? true : false;
    let isFrequency = localStorage.frequency == "true" ? true : false;

    // Function to toggle API checkbox
    function toggleAPI () {
        localStorage.checked = localStorage.checked === "true" ? false : true;
    }

    // Function to toggle params checkbox
    function toggleParams (type) {
        switch (type) {
            case 'speed': localStorage.speed = localStorage.speed === "true" ? false : true;
                break;
            case 'location': localStorage.location = localStorage.location === "true" ? false : true;
                break;
            case 'frequency': localStorage.frequency = localStorage.frequency === "true" ? false : true;
                break;
        }
    }

    // Function to send data to API
    function sendData () {
        if (isChecked) {
            // Read data from log files
            const speed = fs.readFileSync('./logs/api_logs/NetSpeedLog.txt', 'utf8');
            const frequency = fs.readFileSync('./logs/api_logs/PingLog.txt', 'utf8');
            const location = fs.readFileSync('./logs/api_logs/testServerLocationLog.txt', 'utf8');

            fetch('https://neuron-app-api.herokuapp.com/api/users/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: $settings.id,
                    speed: isSpeed && speed.trim() ? speed : null,
                    frequency: isFrequency && frequency.trim() ? frequency : null,
                    location: isLocation && location.trim() ? location : null
                })
            })
            .then(res => res.json())
            .then(data => console.log(data.data));
        }
    }

    // Call the function every 10 seconds
    setInterval(sendData, 60000);
</script>

<Page _currPage="API">
    <div class="p-6">
        <div class="flex flex-row justify-between items-center">
            <h1
                class="text-xl mt-4"
                style="color: {$settings.fontColor2}"
            >
                Allow Neuron to collect system related information such as network speed, location and frequency
            </h1>
            <label
                for="toggle-api"
                class="switch ml-4 mt-6"
            >
                <input
                    type="checkbox"
                    bind:checked={isChecked}
                    on:click={toggleAPI}
                    id="toggle-api"
                >
                <span class="slider round" />
            </label>
        </div>
        <div class="text-white p-2 my-8 rounded-md bg-green-500 border-4 border-green-700 ">
            Note : This information is only being collected as part of a public API for developers.
            This data will only be used for building third-party applications, provide better services
            by Internet Service Providers etc.
        </div>
        {#if isChecked}
        <div style="color: {$settings.fontColor2};">
            <h3 class="text-xl mb-2">
                Data to be sent to the API
            </h3>
            <table class="table-auto text-md">
                <tr>
                    <td class="py-2 pr-16" style="color: {$settings.fontColor2}">Network Speed</td>
                    <td>
                        <label 
                        for="toggle-speed"
                        class="switch ml-4"
                        >
                        <input 
                        type="checkbox"
                        bind:checked={isSpeed}
                        on:click={() => toggleParams('speed')}
                        id="toggle-speed"
                        >
                        <span class="slider round" />
                        </label>
                    </td>
                </tr>
                <tr>
                    <td class="py-2 pr-16" style="color: {$settings.fontColor2}">Your Location</td>
                    <td>
                        <label 
                        for="toggle-location"
                        class="switch ml-4"
                        >
                        <input 
                        type="checkbox"
                        bind:checked={isLocation}
                        on:click={() => toggleParams('location')}
                        id="toggle-location"
                        >
                        <span class="slider round" />
                        </label>
                    </td>
                </tr>
                <tr>
                    <td class="py-2 pr-16" style="color: {$settings.fontColor2}">Signal Frequency</td>
                    <td>
                        <label 
                        for="toggle-frequency"
                        class="switch ml-4"
                        >
                        <input 
                        type="checkbox"
                        bind:checked={isFrequency}
                        on:click={() => toggleParams('frequency')}
                        id="toggle-frequency"
                        >
                        <span class="slider round" />
                        </label>
                    </td>
                </tr>
            </table>
        </div>
        {/if}
    </div>
</Page>

<style>
    /* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  min-width: 50px;
  height: 24px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: rgb(147 51 234);
}

input:focus + .slider {
  box-shadow: 0 0 1px rgb(147 51 234);
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
