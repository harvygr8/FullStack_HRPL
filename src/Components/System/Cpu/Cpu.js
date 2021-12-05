const { ipcMain } = require('electron');
const si = require('systeminformation');

const getCpuInfo = () => {
    ipcMain.on('get-cpu-info', e => {
        si.cpu()
        .then(data => {
            const cpuInfo = {
                brand: data.brand,
                speed: data.speed,
                cores: data.cores,
                socket: data.socket,
            };
            e.sender.send('get-cpu-info', cpuInfo);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getCpuInfo;
