const { ipcMain } = require('electron');
const si = require('systeminformation');

const getCpuUsage = () => {
    ipcMain.on('get-cpu-usage', e => {
        si.currentLoad()
        .then(data => {
            const cpuUsage = {
                currSys: data.currentLoadSystem,
                curr: data.currentLoad,
                currUsr:data.currentLoadUser
            };
            e.sender.send('get-cpu-usage', cpuUsage);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getCpuUsage;
