const { ipcMain } = require('electron');
const { netstat } = require('node-os-utils');

const getNetworkSpeed = () => {
    ipcMain.on('get-network-speed', e => {
        netstat.inOut()
        .then(data => {
            if (data === 'not supported')
                e.sender.send('get-network-speed', null);
            else
                e.sender.send('get-network-speed', data);
        })
        .catch(err => {
            console.log(err);
        });
    });
}

module.exports = getNetworkSpeed;