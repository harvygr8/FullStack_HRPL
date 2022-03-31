const { ipcMain } = require('electron');
const si = require('systeminformation');

const getProcInfo = () => {
    ipcMain.on('get-proc-info', e => {
        si.processes()
        .then(data => {
            // const pInfo = {
            //     pid:data.list.pid,
            //     name:data.list.name,
            //     priority:data.list.priority
            // };
            console.log(data.list);
            e.sender.send('get-proc-info', data.list);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getProcInfo;
