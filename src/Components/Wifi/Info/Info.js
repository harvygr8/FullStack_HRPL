const { ipcMain } = require('electron');
const si = require('systeminformation');

const getWifiInfo = () => {
    ipcMain.on('get-wifi-info', e => {
        si.wifiNetworks()
        .then(data => {
            const wifiInfo = data.map(item => {
                return {
                    ssid: item.ssid,
                    bssid: item.bssid,
                    mode: item.mode,
                    channel: item.channel,
                    frequency: (item.frequency / 1000).toPrecision(2),
                    security: item.security
                }
            });
            e.sender.send('get-wifi-info', wifiInfo);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getWifiInfo;