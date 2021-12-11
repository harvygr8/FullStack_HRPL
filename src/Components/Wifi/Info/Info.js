const { ipcMain } = require('electron');
const si = require('systeminformation');

const getWifiInfo = () => {
    ipcMain.on('get-wifi-info', e => {
        si.wifiNetworks()
        .then(data => {
            const wifiInfo = {
                ssid: data[0].ssid,
                bssid: data[0].bssid,
                mode: data[0].mode,
                channel: data[0].channel,
                frequency: (data[0].frequency / 1000).toPrecision(2),
                security: data[0].security
            };
            e.sender.send('get-wifi-info', wifiInfo);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getWifiInfo;