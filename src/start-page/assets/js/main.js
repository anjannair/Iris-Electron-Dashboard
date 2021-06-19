(function () {
  'use strict';
  /**
   * Animation on scroll
   */
  function aos_init() {
    // eslint-disable-next-line no-undef
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
    });
  }
  window.addEventListener('load', () => {
    aos_init();
  });

  document.getElementById('get').addEventListener('mouseover', () => {
    document.getElementById('bi').style.paddingLeft = '5px';
  });

  document.getElementById('get').addEventListener('mouseout', () => {
    document.getElementById('bi').style.paddingLeft = '';
  });

  document.getElementById('get').addEventListener('click', async () => {
    const fs = require('fs');
    const remote = require('electron').remote;
    const win = remote.getCurrentWindow();
    const BrowserWindow = remote.BrowserWindow;
    await fs.readFile('start-page/accept.json', 'utf8', function readFileCallback(err, data) {
      if (err) {
        console.log(err);
      }
      else {
        // now it is an object
        var obj = JSON.parse(data);
        // edit the data
        obj.accept = true;
        // convert it back to json
        var json = JSON.stringify(obj, null, 2);
        fs.writeFile('start-page/accept.json', json, 'utf8', err => {
          if (err) {
            console.log(err);
          }
          else {
            var winnew = new BrowserWindow({
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
              },
              height: 600,
              width: 1200,
              frame: false,
              resizable: false,
              show: false,
            });
            winnew.loadFile('index.html');
            // eslint-disable-next-line max-nested-callbacks
            winnew.once('ready-to-show', () => {
              winnew.show();
              win.close();
            });
          }
        });
      }
    });
  });

})();