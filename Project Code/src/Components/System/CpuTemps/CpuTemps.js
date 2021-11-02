const { ipcMain } = require('electron');
const si = require('systeminformation');

const getCpuTemps = () => {
    ipcMain.on('get-cpu-temps', e => {
        si.cpuTemperature()
        .then(data => {
            const cpuTemps = {
                main: data.main,
                max: data.max
            };
            e.sender.send('get-cpu-temps', cpuTemps);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getCpuTemps;