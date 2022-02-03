const { ipcMain } = require('electron');
const si = require('systeminformation');
const extIP = require("ext-ip")();


const getNetworkInterfaces = () => {
    ipcMain.on('get-network-interfaces', e => {
        si.networkInterfaces()
        .then(data => {
            const networkInterfacesInfo = data.map(item => {
                return {
                    iface: item.iface,
                    ip4: item.ip4,
                    mac: item.mac,
                    isDHCP:item.dhcp,
                    isInternal:item.virtual
                }
            });
            e.sender.send('get-network-interfaces', networkInterfacesInfo);
        })
        .catch(err => console.log(err));
    });

    ipcMain.on('get-p-ip', e => {
      extIP.get().then(ip => {
          e.sender.send('get-p-ip', ip);
      }, err => {
          console.error(err);
      });

    });
}

module.exports = getNetworkInterfaces;
