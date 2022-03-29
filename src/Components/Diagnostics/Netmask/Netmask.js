const { ipcMain } = require('electron');
const Netmask = require('netmask').Netmask;

const getNetmaskInfo = () => {
    ipcMain.on('get-netmask-info', (e, ip) => {
        try {
            const block = new Netmask(ip);
            const data = {
                base: block.base,
                mask: block.mask,
                bitmask: block.bitmask,
                hostmask: block.hostmask,
                broadcast: block.broadcast,
                size: block.size,
                first: block.first,
                last: block.last
            }
            e.sender.send('get-netmask-info', data);
        } catch (err) {
            e.sender.send('get-netmask-info', {err: err.message});
        }
    });
};

module.exports = getNetmaskInfo;
