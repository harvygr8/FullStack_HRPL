//Core Electron imports
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Component function imports
const {getCpuInfo , getCpuSpeed} = require('./Components/System/Cpu/Cpu.js');
const getCpuUsage = require('./Components/System/Usage/Usage.js');
const getDiskUsage = require('./Components/System/Disk/Disk.js');
const getRamInfo = require('./Components/System/Ram/Ram.js');
const getGraphicsInfo = require('./Components/System/Graphics/Graphics.js');
const getPingInfo = require('./Components/Network/Ping/Ping.js')
const getDnsLookup = require('./Components/Network/Dns/Dns.js');
const getNetworkInterfaces = require('./Components/Network/NetworkInterfaces/NetworkInterfaces.js');
const getOpenPorts = require('./Components/Network/Ports/Ports.js')
const getWifiInfo = require('./Components/Wifi/Info/Info.js');
const getWifiInterfaces = require('./Components/Wifi/Interfaces/Interfaces.js');
const getSslInfo = require('./Components/Diagnostics/SslChecker/SslChecker.js');
const getNetstatInfo = require('./Components/Diagnostics/Netstat/Netstat.js');
const getNetworkSpeed = require('./Components/Diagnostics/NetworkSpeed/NetworkSpeed.js');
const getOsInfo = require('./Components/System/OS/OSInfo.js');
const getIpInfo = require('./Components/Network/IPTools/IPTools.js');
const getLocalDevices = require('./Components/Diagnostics/ArpLD/LocalDevices.js');
const getNetmaskInfo = require('./Components/Diagnostics/Netmask/Netmask');

// Live Reload
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  awaitWriteFinish: true
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    frame:false,
    minWidth: 600,
    minHeight: 720,
    transparent:true,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../public/index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

getDiskUsage();
getIpInfo();
getCpuInfo();
getCpuSpeed();
getCpuUsage();
getOsInfo();
getRamInfo();
getGraphicsInfo();
getPingInfo();
getWifiInfo();
getWifiInterfaces();
getNetworkInterfaces();
getOpenPorts();
getDnsLookup();
getSslInfo();
getNetstatInfo();
getNetworkSpeed();
getLocalDevices();
getNetmaskInfo();