const { ipcMain } = require('electron');
const Evilscan = require('evilscan');


let d=[];
let finalData=[];
let evilscan;

const getOpenPorts=()=>{
  ipcMain.on('get-open-ports', (e, name) => {
    d.splice(0,d.length);
    finalData.splice(0,finalData.length);

      const options = {
          target:name?name:"127.0.0.1",
          port:'1-6000',
          status:'TROU', // Timeout, Refused, Open, Unreachable
          banner:true
      };
      evilscan = new Evilscan(options);
      evilscan.run();

      evilscan.on('result',data => {
          d.push(data);
          //console.log(d);

          for(const obj of d){
            if(obj.status === "open"){
              if(finalData.includes(obj.port)==false){
                if(obj.port===80){
                  finalData.push("HTTP: ")
                }
                if(obj.port===21){
                  finalData.push("FTP: ")
                }
                if(obj.port===22){
                  finalData.push("SSH: ")
                }
                if(obj.port===25){
                  finalData.push("SMTP: ")
                }
                if(obj.port===43){
                  finalData.push("WHOIS: ")
                }
                if(obj.port===53){
                  finalData.push("DNS: ")
                }
                if(obj.port===443){
                  finalData.push("HTTPS: ")
                }
                finalData.push(obj.port);
              };
            };
          };
          //console.log(finalData);
      });

      evilscan.on('error', err => {
          //throw new Error(data.toString());
          e.sender.send('get-open-ports', err);
      });

      evilscan.on('done', () => {
          // finished !
          console.log(finalData);
          e.sender.send('get-open-ports', finalData);

      });
  });
};


module.exports = getOpenPorts;
