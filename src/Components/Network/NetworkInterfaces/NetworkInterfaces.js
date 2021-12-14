const { ipcMain } = require('electron');
const si = require('systeminformation');

const getNetworkInterfaces = () => {
    ipcMain.on('get-network-interfaces', e => {
        si.networkInterfaces()
        .then(data => {
            const networkInterfacesInfo = data.map(item => {
                return {
                    iface: item.iface,
                    ip4: item.ip4
                }
            });
            e.sender.send('get-network-interfaces', networkInterfacesInfo);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getNetworkInterfaces;