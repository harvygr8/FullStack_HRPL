const { ipcMain} = require('electron');
const si = require('systeminformation');

const getRamInfo = () => {
    ipcMain.on('get-ram-info', e => {
        si.mem()
        .then(data => {
            const ramInfo = {
                total: data.total,
                free: data.free,
                used: data.used
            };
            e.sender.send('get-ram-info', ramInfo);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getRamInfo;