const { ipcMain } = require('electron');
const dns = require('dns');

const getDnsLookup = () => {
    ipcMain.on('get-dns-lookup', (e, name) => {
        dns.lookup(name, (err, address, family) => {
            if (!err) {
                e.sender.send('get-dns-lookup', {
                    address, 
                    family
                });
                return
            }
            e.sender.send('get-dns-lookup', { err });
        });
    });
}

module.exports = getDnsLookup;