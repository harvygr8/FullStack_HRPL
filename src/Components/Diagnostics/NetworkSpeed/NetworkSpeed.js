const { ipcMain } = require('electron');
//const { netstat } = require('node-os-utils');
const { UniversalSpeedtest, SpeedUnits } = require('universal-speedtest');

const universalSpeedtest = new UniversalSpeedtest({
    measureUpload: false,
    measureDownload:true,
    debug:true,
    downloadUnit: SpeedUnits.Mbps,
    wait:true
});

const getNetworkSpeed = () => {
    ipcMain.on('get-network-speed', async (e) => {
      universalSpeedtest.runSpeedtestNet()
      .then(result => {
          //console.log(result);
          e.sender.send('get-network-speed',result);
      })
      .catch(err =>{
        console.log(err);
        e.sender.send('get-network-speed',{err:err});
      });
    });
}

module.exports = getNetworkSpeed;
