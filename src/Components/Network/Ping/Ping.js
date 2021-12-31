const { ipcMain } = require('electron');
const ping = require('ping');


const getPingInfo = () =>{
  ipcMain.on('get-ping-info', async (e,arg) =>{
    ping.promise.probe(arg)
    		.then(data => {
          console.log(data);
          const pingInfo = {
            time:data.time === 'unknown'? '0' : data.time,
            alive:data.alive,
            hst:data.numeric_host,
            loss:Number(data.packetLoss).toPrecision(3)
          };
          e.sender.send('get-ping-info', pingInfo);
    		})
        .catch(err => console.log(err));
      });
}

module.exports = getPingInfo;
