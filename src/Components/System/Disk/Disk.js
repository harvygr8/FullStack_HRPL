const { ipcMain } = require('electron');
const si = require('systeminformation');
const diskusage = require('diskusage-ng');
const os = require('os');

let path = os.platform() === 'win32' ? 'c:' : '/';


// diskusage(path, function(err, usage) {
// 	if (err) return console.log(err);
//
// 	console.log(usage.total);
// 	console.log(usage.used);
// 	console.log(usage.available);
// })


const getDiskUsage = () => {
    ipcMain.on('get-disk-usage', e => {
        diskusage(path ,(err,data)=>{
          if (err) return console.log(err);
          const diskUsage = {
              total:data.total,
              free: data.available,
              used: data.used
          };
          e.sender.send('get-disk-usage', diskUsage);
        });
        })
};

module.exports = getDiskUsage;
