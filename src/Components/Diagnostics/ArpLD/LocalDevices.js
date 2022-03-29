const { ipcMain } = require('electron');
const find = require('local-devices');


const getLocalDevices = () => {
    ipcMain.on('get-local-devices', e => {
      find().then(devices => {
        //console.log(devices);
        //
        // const deviceInfo = devices.map(item => {
        //     return {
        //         ip4: item.ip,
        //         mac: item.mac,
        //     }
        // });
        e.sender.send('get-local-devices', devices);
      })
      .catch(err => console.log(err));
    });
}

module.exports = getLocalDevices;
