const { ipcMain } = require('electron');
const si = require('systeminformation');

const getGraphicsInfo = () => {
    ipcMain.on('get-graphics-info', e => {
        si.graphics()
        .then(data => {
            const graphicsInfo = {
                vendor: data.controllers[0].vendor,
                model: data.controllers[0].model,
                bus: data.controllers[0].bus,
                vram: data.controllers[0].vram
            };
            e.sender.send('get-graphics-info', graphicsInfo);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getGraphicsInfo;