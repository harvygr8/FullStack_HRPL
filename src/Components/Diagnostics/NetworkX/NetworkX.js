const { ipcMain} = require('electron');
const si = require('systeminformation');

const getNxInfo = () => {
    ipcMain.on('get-nx-info', e => {
        si.networkStats()
        .then(data => {
            const nxInfo = {
                tx: data[0].tx_bytes,
                rx: data[0].rx_bytes,
                iface: data[0].iface,
                txd:data[0].tx_dropped,
                rxd:data[0].rx_dropped,
                txe:data[0].tx_errors,
                rxe:data[0].rx_errors

            };
            //console.log(nxInfo);
            e.sender.send('get-nx-info', nxInfo);
        })
        .catch(err => console.log(err));
    });
}

module.exports = getNxInfo;
