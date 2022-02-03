const { ipcMain } = require('electron');
const ipInfo = require("ip-info-finder");


const getIpInfo = () =>{
  ipcMain.on('get-geo-info', (e,arg) =>{
    ipInfo.getIPInfo(arg).then(data => {
      console.log(data);
      e.sender.send('get-geo-info',data);
    })
    .catch(err => console.log(err));
  });
}

module.exports = getIpInfo;
