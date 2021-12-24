const { ipcMain } = require('electron');
const si = require('systeminformation');

const getOsInfo = () => {
    ipcMain.on('get-os-info', e => {
        si.osInfo()
        .then(data => {
            const osInfo = {
                platform: data.platform,
                hostname: data.hostname,
                kernel: data.kernel,
                fqdn: data.fqdn,
            };
            e.sender.send('get-os-info', osInfo);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getOsInfo;
