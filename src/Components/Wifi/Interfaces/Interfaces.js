const { ipcMain } = require('electron');
const si = require('systeminformation');

const getWifiInterfaces = () => {
    ipcMain.on('get-wifi-interfaces', e => {
        si.wifiInterfaces()
        .then(data => {
            const wifiInterfaces = data.map(item => {
                return {
                    id: item.id,
                    iface: item.iface,
                    model: item.model,
                    vendor: item.vendor,
                    mac: item.mac
                }
            });
            e.sender.send('get-wifi-interfaces', wifiInterfaces);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getWifiInterfaces;