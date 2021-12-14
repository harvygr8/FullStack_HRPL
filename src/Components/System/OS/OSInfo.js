const { ipcMain } = require('electron');
const si = require('systeminformation');

const getCpuTemps = () => {
    ipcMain.on('get-cpu-temps', e => {
        si.osInfo()
        .then(data => {
            const cpuTemps = {
                platform: data.platform,
                hostname: data.hostname,
                kernel: data.kernel,
                fqdn: data.fqdn,
            };
            e.sender.send('get-cpu-temps', cpuTemps);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getCpuTemps;