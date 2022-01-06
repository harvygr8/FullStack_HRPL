<script>
    //Svelte
    import Page from './_page.svelte';
    import { settings } from '../Stores/settingsStore';
    import Shell from '../Components/Misc/Shell.svelte'

    let username = $settings.username;
    let bgColor1 = $settings.bgColor1;
    let bgColor2 = $settings.bgColor2;
    let bgColor3 = $settings.bgColor3;
    let fontColor1 = $settings.fontColor1;
    let fontColor2 = $settings.fontColor2;
    let font = $settings.font;

    const applyChanges = type => {
        // Set store values 
        $settings.username = type == 'save' ? document.getElementById('username').value : 'Admin';
        $settings.bgColor1 = type == 'save' ? document.getElementById('bgColor-1').value : '#111827';
        $settings.bgColor2 = type == 'save' ? document.getElementById('bgColor-2').value : '#1F2937';
        $settings.bgColor3 = type == 'save' ? document.getElementById('bgColor-3').value : '#374151';
        $settings.fontColor1 = type == 'save' ? document.getElementById('fontColor-1').value : '#ffffff';
        $settings.fontColor2 = type == 'save' ? document.getElementById('fontColor-2').value : '#f0f0f0';
        // $settings.linkColor = type == 'save' ? document.getElementById('linkColor').value: '#374151',
        // $settings.miscColor = type == 'save' ? document.getElementById('miscColor').value: '#8B5CF6',
        $settings.font = type == 'save' ? document.getElementById('font').value : '';

        // Set localStorage values
        localStorage.username = $settings.username;
        localStorage.bgColor1 = $settings.bgColor1;
        localStorage.bgColor2 = $settings.bgColor2;
        localStorage.bgColor3 = $settings.bgColor3;
        localStorage.fontColor1 = $settings.fontColor1;
        localStorage.fontColor2 = $settings.fontColor2;
        localStorage.font = $settings.font;

        // Set state variable values
        username = $settings.username;
        bgColor1 = $settings.bgColor1;
        bgColor2 = $settings.bgColor2;
        bgColor3 = $settings.bgColor3;
        fontColor1 = $settings.fontColor1;
        fontColor2 = $settings.fontColor2;
        font = $settings.font;
    };
</script>

<Page _currPage="Settings">
<div class="p-6">
  <Shell title={"CONFIGURE APPLICATION"} tooltip={"Change Application Settings"}>
    <div 
    class="flex flex-col items-center justify-center rounded-md p-1" 
    style="background-color: {$settings.bgColor3};"  
    >
      <!-- <h2
          class="text-3xl mb-8 mt-4 font-bold"
          style="color: {$settings.fontColor2};"
      >
      </h2> -->
      <!-- Username -->
      <div class="flex flex-col justify-start">
          <label
              class="text-lg pb-2 text-center"
              style="color: {$settings.fontColor2};"
              for="username"
          >
              Dashboard Username
          </label>
          <input
              class="w-full sm:w-96 rounded-md p-1 mb-6 text-gray-900"
              value={username}
              type="text"
              id="username"
          />
      </div>
      <!-- Background Colors -->
      <div class="flex flex-col justify-center">
          <label
              class="text-sm pb-2 text-center"
              style="color: {$settings.fontColor2};"
              for="Background Colors"
          >
                 Background Colors
          </label>
          <div>
              <input
                  class="m-3 rounded-sm"
                  value={bgColor1}
                  type="color"
                  id="bgColor-1"
              />
              <input
                  class="m-3 rounded-sm"
                  value={bgColor2}
                  type="color"
                  id="bgColor-2"
              />
              <input
                  class="m-3 rounded-sm"
                  value={bgColor3}
                  type="color"
                  id="bgColor-3"
              />
          </div>
      </div>
      <!-- Font Colors -->
      <div class="mt-4 flex flex-col justify-center">
          <label
              class="text-sm text-center pb-2"
              style="color: {$settings.fontColor2};"
              for="Font Colors"
          >
              Font Colors
          </label>
          <div>
              <input
                  class="m-3 rounded-sm"
                  value={fontColor1}
                  type="color"
                  id="fontColor-1"
              />
              <input
                  class="m-3 rounded-sm"
                  value={fontColor2}
                  type="color"
                  id="fontColor-2"
              />
          </div>
      </div>
      <!-- Font -->
      <div class="flex flex-col justify-center">
          <label
              class="text-sm pb-2 text-center"
              style="color: {$settings.fontColor2};"
              for="font"
          >
              Font
          </label>
          <select
              value={font}
              name="font"
              id="font"
              class="w-max mb-6 px-2 py-1 rounded-md text-gray-800"
          >
              <option value="">
                  Default
              </option>
              <option value="Roboto">
                  Roboto
              </option>
              <option value="Open Sans">
                  Open Sans
              </option>
              <option value="Lato">
                  Lato
              </option>
              <option value="Montserrat">
                  Montserrat
              </option>
          </select>
      </div>
      <!-- Buttons -->
      <div class="flex flex-row justify-center items-center">
          <button
              class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600"
              style="color: {$settings.fontColor1};"
              on:click={() => applyChanges('save')}
          >
              APPLY
          </button>
          <button
              class="text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600"
              style="color: {$settings.fontColor1};"
              on:click={() => applyChanges('reset')}
          >
              RESET
          </button>
      </div>
  </div>

  </Shell>
</div>
</Page>

<style>
    input[type=color]
    {
	    width: 40px;
	    height: 40px;
	    border: none;
	    border-radius: 8px;
	    background: none;
    }

    input[type="color"]::-webkit-color-swatch-wrapper {
	    padding: 0;
    }
    input[type="color"]::-webkit-color-swatch {
	    border: solid 1px #000; /*change color of the swatch border here*/
	    border-radius: 8px;
    }
</style>