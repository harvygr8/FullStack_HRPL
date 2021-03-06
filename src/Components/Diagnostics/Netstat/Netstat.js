const { ipcMain } = require('electron');
const { netstat } = require('node-netstat');
const fs = require('fs')
const os = require('os')

const cmd = ['netstat -n' , 'netstat -a']
let execMd;

if(os.platform()==='linux')
{
  execMd=cmd[1];
}
if(os.platform()==='win32')
{
  execMd=cmd[0];
}


const exec = require('child_process').exec
let result = '';

// fs.truncate('/path/to/file', 0, function(){console.log('done')})
const getNetstatInfo = () => {
  fs.unlink('./logs/raw_logs/netstatlog.txt', function(){startRT()});
}


const startRT = () => {
    ipcMain.on('get-netstat-info', e => {

      let logStream = fs.createWriteStream('./logs/raw_logs/netstatlog.txt', {flags: 'w'});
      const finalArr =[];

      exec(execMd, (err, stdout, stderr) => {

        logStream.write(stdout);

        fs.readFile('./logs/raw_logs/netstatlog.txt', function(err, data) {
            if(err) throw err;
            let array = data.toString().split("\n");

            for(let i of array)
            {
              let words = i.split(" ");

              let fil = words.filter((el)=>{
                return el!="";
              })

              let ob;

              if(execMd===cmd[0]) //windows
              {
                if(fil.length===4){

                  ob = {
                      'proto' : fil[0],
                      'localip' : fil[1],
                      'foriegnip':fil[2],
                      'state':fil[3]
                  }
                  finalArr.push(ob);
                }
              }
              else if(execMd===cmd[1]) //linux
              {
                if(fil.length===6){

                  ob = {
                      'proto' : fil[0],
                      'localip' : fil[3],
                      'foriegnip':fil[4],
                      'state':fil[5]
                  }
                  finalArr.push(ob);
                }
              }

            }
            e.sender.send('get-netstat-info',finalArr);
        });
      });

    });
}

module.exports = getNetstatInfo;
