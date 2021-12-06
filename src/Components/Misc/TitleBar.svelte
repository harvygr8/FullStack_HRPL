<script>
  const { remote } = require('electron');

  let window = remote.getCurrentWindow();

  // Minimize the application
  function minimizeWindow() {
    window.minimize();
  }

  // Maximize the application
  function maximizeWindow() {
    window.maximize();
  }

  // Quit the application
  function closeWindow() {
    window.close();
  }
</script>

<div style="border-radius:0px 16px 16px 0px" class="bg-gray-900 flex flex-row justify-between">
  <div class="drag">
    <p class="text-white text-2xl font-bold pt-1 pl-16 pb-1"></p>
  </div>
  <div class="drag">
    <p class="text-white text-2xl font-bold pt-2 pl-6 pb-1">NEURON</p>
  </div>
  <div class="p-2">
    <!-- Buttons need to be fixed! -->
    <button type="button" on:click={minimizeWindow} class="links mx-2 text-white hover:text-blue-700 fa fa-window-minimize" aria-hidden="true"></button>
    <button type="button" on:click={maximizeWindow} class="links mx-2 text-white hover:text-blue-700 fa fa-window-maximize" aria-hidden="true"></button>
    <button type="button" on:click={closeWindow} class="links mx-2 text-white hover:text-blue-700 fa fa-times" aria-hidden="true"></button>
  </div>
</div>

<style>
.drag {
  -webkit-user-select: none;
  -webkit-app-region: drag;
}
</style>
