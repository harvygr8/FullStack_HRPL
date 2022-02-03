const { ipcMain } = require('electron');
//const dns = require('dns');
const nslookup = require('nslookup')

const getDnsLookup = () => {
    ipcMain.on('get-dns-lookup', (e, name) => {
      let res={};
      let nservers=[];
      let mservers=[];

      nslookup(name)
        .server('8.8.8.8') // default is 8.8.8.8
        .type('a') // default is 'a'
        .timeout(10 * 1000) // default is 3 * 1000 ms
        .end(function (err, addrs) {
          res.address = addrs[0];

          nslookup(name)
            .server('8.8.8.8') // default is 8.8.8.8
            .type('ns') // default is 'a'
            .timeout(10 * 1000) // default is 3 * 1000 ms
            .end(function (err, ns) {
              res.ns = ns;

              nslookup(name)
                .server('8.8.8.8') // default is 8.8.8.8
                .type('mx') // default is 'a'
                .timeout(10 * 1000) // default is 3 * 1000 ms
                .end(function (err, mx) {
                  res.mx = mx;
                  console.log(res);
                  e.sender.send('get-dns-lookup',res);
                });
            });
        });



        // dns.resolveAny(name, (err,ret)=>{
        //   let res={};
        //   let nservers=[];
        //   let mservers=[];
        //
        //   if(err){
        //     console.log(err);
        //   }
        //   else{
        //     //console.log(ret);
        //     for(i of ret)
        //     {
        //       if(i.type==="A"){
        //         res.address=i.address;
        //       }
        //
        //       if(i.type==="NS"){
        //         nservers.push(i.value);
        //       }
        //
        //       if(i.type==="MX"){
        //         mservers.push(i.exchange);
        //       }
        //     }
        //     res.ns = nservers;
        //     res.mx = mservers;
        //     e.sender.send('get-dns-lookup',res);
        //     console.log(res);
        //   }
        // });

        //console.log(res);

    });
};

module.exports = getDnsLookup;
