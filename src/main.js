const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const accept = require('./start-page/accept.json')['accept'];
const fs = require('fs');
let win;

function create() {
    if (accept) {
        win = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                devTools: false,
            },
            height: 600,
            width: 1200,
            frame: false,
            resizable: false,
            show: false,
        });
        win.setIcon('icons/iris.png');
        win.loadFile('index.html');
        win.once('ready-to-show', () => {
            win.show();
            fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - Main application, Iris, has started\n', function (err) {
                if (err) {
                    return console.error(err);
                }
            });
        });

    }
    else {
        win = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                devTools: false,
            },
            height: 600,
            width: 1200,
            frame: false,
            resizable: false,
            show: false,
        });
        win.setIcon('icons/iris.png');
        win.loadFile('start-page/start.html');
        win.once('ready-to-show', () => {
            win.show();
            fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - Start page is being displayed\n', function (err) {
                if (err) {
                    return console.error(err);
                }
            });
        });

    }
}

app.on('ready', create);

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();
        fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - App has been shutdown\n', function (err) {
            if (err) {
                return console.error(err);
            }
        });
    }
});

app.on('activate', () => {
    if (win == null) {
        create();
        fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - A new window has been creatrd\n', function (err) {
            if (err) {
                return console.error(err);
            }
        });
    }
});