const { ipcMain } = require('electron');
const si = require('systeminformation');

const getGraphicsInfo = () => {
    ipcMain.on('get-graphics-info', e => {
        si.graphics()
        .then(data => {
            const graphicsInfo = {
                vendor: data.controllers[0].vendor,
                model: data.controllers[0].model.slice(6,),
                bus: data.controllers[0].bus,
                vram: data.controllers[0].vram,
                connection: data.displays[0].connection,
                display: data.displays[0].model,
                refresh: data.displays[0].currentRefreshRate,
                resx: data.displays[0].resolutionX,
                resy: data.displays[0].resolutionY,
            };
            e.sender.send('get-graphics-info', graphicsInfo);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getGraphicsInfo;
