const { ipcMain } = require('electron');
const whoisLight = require("whois-light");

let whois;

const getWhoisInfo = () =>{
  ipcMain.on('get-whois-info', (e,arg) =>{
    whoisLight.lookup({ format: true },arg)
      .then(data => {
        const whois = {
          url:data["Registrar URL"],
          cn:data["Registrant Country"] ? data["Registrant Country"] : "N/A",
          st:data["Registrant State/Province"] ? data["Registrant State/Province"] : "N/A",
          expiry:data["Registry Expiry Date"].slice(0,10),
        };
        console.log(data);
        e.sender.send('get-whois-info' ,whois );
      })
      .catch(console.error);
  });
}

module.exports = getWhoisInfo;
