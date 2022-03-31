<script>
    //Svelte
    import Page from './_page.svelte';
    import { settings } from '../Stores/settingsStore';

    let username = $settings.username;
    let bgColor1 = $settings.bgColor1;
    let bgColor2 = $settings.bgColor2;
    let bgColor3 = $settings.bgColor3;
    let bgColor4 = $settings.bgColor4;
    let fontColor1 = $settings.fontColor1;
    let fontColor2 = $settings.fontColor2;
    let font = $settings.font;

    const applyChanges = type => {
        // Set store values
        $settings.username = type == 'save' ? document.getElementById('username').value : 'Neuron';
        $settings.bgColor1 = type == 'save' ? document.getElementById('bgColor-1').value : '#1F2937';
        $settings.bgColor2 = type == 'save' ? document.getElementById('bgColor-2').value : '#111827';
        $settings.bgColor3 = type == 'save' ? document.getElementById('bgColor-3').value : '#374151';
        $settings.bgColor4 = type == 'save' ? document.getElementById('bgColor-4').value : '#a855f7';
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
        localStorage.bgColor4 = $settings.bgColor4;
        localStorage.fontColor1 = $settings.fontColor1;
        localStorage.fontColor2 = $settings.fontColor2;
        localStorage.font = $settings.font;

        // Set state variable values
        username = $settings.username;
        bgColor1 = $settings.bgColor1;
        bgColor2 = $settings.bgColor2;
        bgColor3 = $settings.bgColor3;
        bgColor4 = $settings.bgColor4;
        fontColor1 = $settings.fontColor1;
        fontColor2 = $settings.fontColor2;
        font = $settings.font;
    };
</script>

<Page _currPage="Settings">
<div class="mt-4 p-6">
    <div
    class="flex flex-col items-start justify-center rounded-md "

    >
    <h1
    class="text-xl mb-10"
    style="color: {$settings.fontColor2}"
    >
        Change the application fonts and tweak the theme to get a custom look and feel
    </h1>
      <!-- <h2
          class="text-3xl mb-8 mt-4 font-bold"
          style="color: {$settings.fontColor2};"
      >
      </h2> -->
      <!-- Username -->
      <div class="flex flex-col items-start justify-start mb-6">
          <label
              class="font-semibold pb-2 text-center"
              style="color: {$settings.fontColor2};"
              for="username"
          >
              Dashboard Username
          </label>
          <input
              class="w-96 rounded-md p-1 text-gray-800"
              value={username}
              type="text"
              id="username"
          />
      </div>
      <!-- Background Colors -->
      <div class="flex flex-col items-start justify-center mb-6">
          <label
              class="font-semibold text-center pb-2"
              style="color: {$settings.fontColor2};"
              for="Background Colors"
          >
                 Background Colors
          </label>
          <div>
              <input
                  class="mr-3 rounded-sm"
                  value={bgColor1}
                  type="color"
                  id="bgColor-1"
              />
              <input
                  class="mx-3 rounded-sm"
                  value={bgColor2}
                  type="color"
                  id="bgColor-2"
              />
              <input
                  class="mx-3 rounded-sm"
                  value={bgColor3}
                  type="color"
                  id="bgColor-3"
              />
              <input
                  class="mx-3 rounded-sm"
                  value={bgColor4}
                  type="color"
                  id="bgColor-4"
              />
          </div>
      </div>
      <!-- Font Colors -->
      <div class="flex flex-col items-start justify-center mb-6">
          <label
              class="font-semibold text-center pb-2"
              style="color: {$settings.fontColor2};"
              for="Font Colors"
          >
              Font Colors
          </label>
          <div>
              <input
                  class="mr-3 rounded-sm"
                  value={fontColor1}
                  type="color"
                  id="fontColor-1"
              />
              <input
                  class="mx-3 rounded-sm"
                  value={fontColor2}
                  type="color"
                  id="fontColor-2"
              />
          </div>
      </div>
      <!-- Font -->
      <div class="flex flex-col items-start justify-center mb-6">
          <label
              class="font-semibold pb-2 text-center pb-2"
              style="color: {$settings.fontColor2};"
              for="font"
          >
              Font Style
          </label>
          <select
              value={font}
              name="font"
              id="font"
              class="w-max mb-4 px-2 py-1 rounded-md text-gray-800"
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
      <div class="flex flex-row items-start justify-center items-center">
          <button
              class="text-sm bg-purple-500 p-8 py-1 my-2 rounded-md mr-1 font-semibold hover:bg-purple-600"
              style="color: {$settings.fontColor1};"
              on:click={() => applyChanges('save')}
          >
              Apply
          </button>
          <button
              class="text-sm bg-purple-500 px-8 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600"
              style="color: {$settings.fontColor1};"
              on:click={() => applyChanges('reset')}
          >
              Reset
          </button>
      </div>
  </div>

</div>
</Page>

<style>
    input[type=color]
    {
	    width: 24px;
	    height: 24px;
	    border: none;
	    border-radius: 9999px;
	    background: none;
        border-color: #f0f0f0;
    }

    input[type="color"]::-webkit-color-swatch-wrapper {
	    padding: 0;
    }
    input[type="color"]::-webkit-color-swatch {
	    border: solid 1px #000; /*change color of the swatch border here*/
	    border-radius: 9999px;
        border-color: #333;
    }
</style>
