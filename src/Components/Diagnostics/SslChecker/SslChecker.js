const { ipcMain } = require('electron');
const sslChecker = require('ssl-checker');

const getSslInfo = () => {
    ipcMain.on('get-ssl-info', (e, host) => {
        sslChecker(host, {
            method: 'GET',
        })
        .then(data => {
            e.sender.send('get-ssl-info', data);
        })
        .catch(err => {
            // console.log('Error: ', err);
            e.sender.send('get-ssl-info', { err: 'error'});
        });
    });
}

module.exports = getSslInfo;