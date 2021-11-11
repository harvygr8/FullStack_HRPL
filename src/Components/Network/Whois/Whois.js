const { ipcMain } = require('electron');
const whoiser = require('whoiser');


const getWhoisInfo = () =>{
  ipcMain.on('get-whois-info', async (e,arg) =>{
    console.log("HERE");
    const ipInfo = await whoiser(arg, {host: 'whois.arin.net'});
    console.log("HERE2");
    console.log(ipInfo);
    e.sender.send('get-whois-info' ,ipInfo);
  });
}

module.exports = getWhoisInfo;
