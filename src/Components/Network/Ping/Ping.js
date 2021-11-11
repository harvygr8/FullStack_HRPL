const { ipcMain } = require('electron');
const ping = require('ping');


const getPingInfo = () =>{
  ipcMain.on('get-ping-info', async (e,arg) =>{
    ping.promise.probe(arg)
    		.then(data => {
          const pingInfo = {
            time:data.time,
            alive:data.alive,
            hst:data.numeric_host,
          };
          e.sender.send('get-ping-info', pingInfo);
    		})
        .catch(err => console.log(err));
      });
}

module.exports = getPingInfo;
