const { ipcMain } = require('electron');
const { netstat } = require('node-os-utils');

const getNetstatInfo = () => {
    ipcMain.on('get-netstat-info', e => {
        netstat.stats()
        .then(data => {
            if (data === 'not supported')
                e.sender.send('get-netstat-info', null);
            else
                e.sender.send('get-netstat-info', data);
        })
        .catch(err => {
            console.log(err);
        });
    });
}

module.exports = getNetstatInfo;