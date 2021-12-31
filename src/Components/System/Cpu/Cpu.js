const { ipcMain } = require('electron');
const si = require('systeminformation');

const getCpuInfo = () => {
    ipcMain.on('get-cpu-info', e => {
        si.cpu()
        .then(data => {
            const cpuInfo = {
                brand: data.brand,
                speed: data.speed,
                cores: data.cores.toPrecision(2),
                socket: data.socket,
            };
            e.sender.send('get-cpu-info', cpuInfo);
        })
        .catch(err => console.log(err));
    });
};


const getCpuSpeed = () => {
    ipcMain.on('get-cpu-speed', e => {
        si.cpuCurrentSpeed()
        .then(data => {
            const cpuSpeed = {
                min: data.min,
                max:data.max
            };
            e.sender.send('get-cpu-speed', cpuSpeed);
        })
        .catch(err => console.log(err));
    });
};

module.exports = {getCpuInfo , getCpuSpeed};
