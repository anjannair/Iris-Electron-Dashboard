const remote = require('electron').remote;
const win = remote.getCurrentWindow();
const BrowserWindow = remote.BrowserWindow;
const Tray = remote.Tray;
const Menu = remote.Menu;
const speed = require('./speed-test/speed.js');
const fs = require('fs');
var put_country = require('./settings/store.json');
var utc_hour = put_country.utc_hour;
var utc_minute = put_country.utc_minute;

// eslint-disable-next-line no-unused-vars
async function speedt() {
    var newspeed = new speed();
    var get_speed = await newspeed.speedTest();
    fs.appendFile('debug/logs.txt', new Date().toISOString() + ` - Upload and download speed has been fetched from Cloudfare\n${new Date().toISOString()} - Plotting the graph\n`, function (err) {
        if (err) {
            return console.error(err);
        }
    });

    // line chart data of downlaod
    var buyerData = {
        labels: ['100kB', '25MB', '100MB'],
        datasets: [
            {
                fillColor: '#66CDD2',
                strokeColor: '#ACC26D',
                pointColor: '#fff',
                fontColor: 'red',
                pointStrokeColor: '#9DB86D',
                //  Removed 2nd and third element because of untidy graphs being formed
                data: [parseInt(get_speed.download1[0]), parseInt(get_speed.download1[3]), parseInt(get_speed.download1[4])],
            },
        ],
    };
    // get line chart canvas
    var buyers = document.getElementById('graph').getContext('2d');
    // draw line chart
    // eslint-disable-next-line no-undef
    new Chart(buyers).Line(buyerData);
    var uploadData = {
        labels: ['10kB', '10kB', '1MB'],
        datasets: [
            {
                fillColor: '#66CDD2',
                strokeColor: '#ACC26D',
                pointColor: '#fff',
                fontColor: 'red',
                pointStrokeColor: '#9DB86D',
                data: [parseInt(get_speed.upload1[0]), parseInt(get_speed.upload1[1]), parseInt(get_speed.upload1[2])],
            },
        ],
    };
    // get line chart canvas
    var up = document.getElementById('graph-1').getContext('2d');
    // draw line chart
    // eslint-disable-next-line no-undef
    new Chart(up).Line(uploadData);
    document.getElementById('speed').innerHTML = Math.round(get_speed.download) + '<span style="font-size:large"> Mbits/s</span>';
    document.getElementById('speed-1').innerHTML = Math.round(get_speed.upload) + '<span style="font-size:large"> Mbits/s</span>';
}


// When document has loaded, initialise
document.onreadystatechange = () => {
    if (document.readyState == 'complete') {
        handleWindowControls();
    }
};

window.onbeforeunload = () => {
    win.removeAllListeners();
};

//  tray is declared out to prevent garbage collection
//  https://stackoverflow.com/questions/58594357/nodejs-electron-tray-icon-disappearing-after-a-minute
let tray = null;
function handleWindowControls() {
    document.getElementById('min-button').addEventListener('click', () => {
        win.minimize();
        fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - App has been minimized\n', function (err) {
            if (err) {
                return console.error(err);
            }
        });
    });

    document.getElementById('close-button').addEventListener('click', () => {
        if (tray) { return win.hide(); }
        //  tray documentation at - https://github.com/electron/electron/blob/main/docs/api/menu-item.md
        tray = new Tray('icons/iris.png');
        const template = [
            {
                label: 'Iris',
                icon: 'icons/iris-small.png',
                enabled: false,
            },
            {
                type: 'separator',
            },
            {
                label: 'Show App', click: function () {
                    win.show();
                    fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - App has been opened from tray\n', function (err) {
                        if (err) {
                            return console.error(err);
                        }
                    });
                },
            },
            {
                label: 'Quit', click: function () {
                    win.close();
                    fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - App has been shut down\n', function (err) {
                        if (err) {
                            return console.error(err);
                        }
                    });
                },
            },
        ];
        const contextMenu = Menu.buildFromTemplate(template);
        tray.setContextMenu(contextMenu);
        tray.setToolTip('Iris');
        win.hide();
        fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - App has been sent to tray\n', function (err) {
            if (err) {
                return console.error(err);
            }
        });
    });
}

//  checking if the system is online
function online() {
    fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - Internet connection has been made\n', function (err) {
        if (err) {
            return console.error(err);
        }
    });
    document.getElementById('speed').innerHTML = '<img src="icons/infinity.gif" style="padding-left:50px;padding-top:15px">';
    document.getElementById('speed-1').innerHTML = '<img src="icons/infinity.gif" style="padding-left:45px;padding-top:15px">';
    document.getElementById('wifi').innerHTML = '<img id="wifipng" src="icons/wifi.svg" style="transform: scale(1.0)">';
    speedt();
    // eslint-disable-next-line no-undef
    alertify.success('Welcome back!👋', 5);
}
function offline() {
    //  No internet
    fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - Internet connection has been lost\n', function (err) {
        if (err) {
            return console.error(err);
        }
    });
    document.getElementById('wifi').innerHTML = '<img id="wifipng" src="icons/wifi-off.svg" style="transform: scale(1.0)">';
    // eslint-disable-next-line no-undef
    alertify.error('Internet connection lost! After connecting again please hit Ctrl+R to refresh!', 0);
}
function netcheck() {
    navigator.onLine ? online() : offline();
}

netcheck();

// inner variables
var canvas, ctx;
var clockRadius = 80;
var clockImage;

// draw functions :
function clear() {
    // clear canvas function
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawScene() {
    // main drawScene function
    // clear canvas
    clear();

    // get current time
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    hours = hours > 12 ? hours - 12 : hours;
    var hour = hours + minutes / 60;
    var minute = minutes + seconds / 60;

    // save current context
    ctx.save();

    // draw clock image (as background)
    ctx.drawImage(clockImage, 0, 0, 200, 200);

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.beginPath();

    // draw numbers
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var n = 1; n <= 12; n++) {
        var theta = (n - 3) * (Math.PI * 2) / 12;
        var x = clockRadius * 0.85 * Math.cos(theta);
        var y = clockRadius * 0.85 * Math.sin(theta);
        ctx.fillText(n, x, y);
    }

    // draw hour
    ctx.save();
    // eslint-disable-next-line no-redeclare
    var theta = (hour - 3) * 2 * Math.PI / 12;
    ctx.rotate(theta);
    ctx.beginPath();
    ctx.moveTo(-15, -5);
    ctx.lineTo(-15, 5);
    ctx.lineTo(clockRadius * 0.5, 1);
    ctx.lineTo(clockRadius * 0.5, -1);
    ctx.fill();
    ctx.restore();

    // draw minute
    ctx.save();
    // eslint-disable-next-line no-redeclare
    var theta = (minute - 15) * 2 * Math.PI / 60;
    ctx.rotate(theta);
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.lineTo(-15, 4);
    ctx.lineTo(clockRadius * 0.8, 1);
    ctx.lineTo(clockRadius * 0.8, -1);
    ctx.fill();
    ctx.restore();

    // draw second
    ctx.save();
    // eslint-disable-next-line no-redeclare
    var theta = (seconds - 15) * 2 * Math.PI / 60;
    ctx.rotate(theta);
    ctx.beginPath();
    ctx.moveTo(-15, -3);
    ctx.lineTo(-15, 3);
    ctx.lineTo(clockRadius * 0.9, 1);
    ctx.lineTo(clockRadius * 0.9, -1);
    ctx.fillStyle = '#0f0';
    ctx.fill();
    ctx.restore();

    ctx.restore();
}

// initialization
$(function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // var width = canvas.width;
    // var height = canvas.height;

    clockImage = new Image();
    clockImage.src = 'icons/cface.png';

    // loop drawScene
    setInterval(drawScene, 1000);
});


// inner variables
var canvas1, ctx1;
var clockRadius1 = 80;
var clockImage1;

// draw functions :
function clear1() {
    // clear canvas1 function
    ctx1.clearRect(0, 0, ctx1.canvas.width, ctx1.canvas.height);
}

// main drawScene function
function drawScene1() {
    // clear canvas
    clear1();

    // get current time
    var date = new Date();
    var hours = date.getUTCHours() + utc_hour;
    var minutes = date.getUTCMinutes() + utc_minute;
    var seconds = date.getUTCSeconds();
    hours = hours > 12 ? hours - 12 : hours;
    var hour = hours + minutes / 60;
    var minute = minutes + seconds / 60;

    // save current context
    ctx1.save();

    // draw clock image (as background)
    ctx1.drawImage(clockImage1, 0, 0, 200, 200);

    ctx1.translate(canvas1.width / 2, canvas1.height / 2);
    ctx1.beginPath();

    // draw numbers
    ctx1.font = '20px Arial';
    ctx1.fillStyle = 'white';
    ctx1.textAlign = 'center';
    ctx1.textBaseline = 'middle';
    for (var n = 1; n <= 12; n++) {
        var theta = (n - 3) * (Math.PI * 2) / 12;
        var x = clockRadius1 * 0.85 * Math.cos(theta);
        var y = clockRadius1 * 0.85 * Math.sin(theta);
        ctx1.fillText(n, x, y);
    }

    // draw hour
    ctx1.save();
    // eslint-disable-next-line no-redeclare
    var theta = (hour - 3) * 2 * Math.PI / 12;
    ctx1.rotate(theta);
    ctx1.beginPath();
    ctx1.moveTo(-15, -5);
    ctx1.lineTo(-15, 5);
    ctx1.lineTo(clockRadius1 * 0.5, 1);
    ctx1.lineTo(clockRadius1 * 0.5, -1);
    ctx1.fill();
    ctx1.restore();

    // draw minute
    ctx1.save();
    // eslint-disable-next-line no-redeclare
    var theta = (minute - 15) * 2 * Math.PI / 60;
    ctx1.rotate(theta);
    ctx1.beginPath();
    ctx1.moveTo(-15, -4);
    ctx1.lineTo(-15, 4);
    ctx1.lineTo(clockRadius1 * 0.8, 1);
    ctx1.lineTo(clockRadius1 * 0.8, -1);
    ctx1.fill();
    ctx1.restore();

    // draw second
    ctx1.save();
    // eslint-disable-next-line no-redeclare
    var theta = (seconds - 15) * 2 * Math.PI / 60;
    ctx1.rotate(theta);
    ctx1.beginPath();
    ctx1.moveTo(-15, -3);
    ctx1.lineTo(-15, 3);
    ctx1.lineTo(clockRadius1 * 0.9, 1);
    ctx1.lineTo(clockRadius1 * 0.9, -1);
    ctx1.fillStyle = '#0f0';
    ctx1.fill();
    ctx1.restore();

    ctx1.restore();
}

// initialization
$(function () {
    canvas1 = document.getElementById('canvas-1');
    ctx1 = canvas1.getContext('2d');

    // var width = canvas.width;
    // var height = canvas.height;

    clockImage1 = new Image();
    clockImage1.src = 'icons/cface.png';

    // loop drawScene
    setInterval(drawScene1, 1000);
});

//  printing the country
fetch(' https://am.i.mullvad.net/json')
    .then(res => res.json())
    .then(response => {
        document.getElementById('lcountry').innerHTML = response.country;
    })
    .catch((data, status) => {
        fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - The user location could not be fetched because of - ' + data + status + '\n', function (err) {
            if (err) {
                return console.error(err);
            }
        });
    });
var count = 0;
function check() {
    fetch('https://coderadio-admin.freecodecamp.org/api/live/nowplaying/coderadio')
        .then(res => res.json())
        .then(response => {
            if (response.now_playing.song.text.length > 37) {
                document.getElementById('meta').innerHTML = response.now_playing.song.text.substring(0, 35) + '..';
            }
            else {
                document.getElementById('meta').innerHTML = response.now_playing.song.text;
            }
            var i = 0;
            if (i == 0) {
                i = 1;
                var elem = document.getElementById('myBar');
                var width = elem.style.width;
                // eslint-disable-next-line no-inner-declarations
                function frame() {
                    if (width >= 100) {
                        i = 0;
                    }
                    else {
                        width = (response.now_playing.elapsed / response.now_playing.duration) * 100;
                        elem.style.width = width + '%';
                    }
                }
                frame();
            }
        })
        .catch((data, status) => {
            if (count == 0) {
                // eslint-disable-next-line no-undef
                alertify.error('Internet connection lost! After connecting again please hit Ctrl+R to refresh!', 0);
                fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - Code Radio data error - ' + data + '\n', function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
                fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - Code Radio status error - ' + status + '\n', function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
            }
            count++;
        });
}

let interval;
document.getElementById('play-pause').addEventListener('click', () => {
    var x = document.getElementById('myAudio');
    if (document.getElementById('play-pause').innerHTML.trim().startsWith('<img id="play"')) {
        document.getElementById('play-pause').innerHTML = '<img id="pause" class="icon" srcset="icons/pause.svg" draggable="false" style="padding-top: 20px;cursor: pointer;" />';
        x.play();
        fs.appendFile('debug/logs.txt', new Date().toISOString() + ` - The player has been played\n${new Date().toISOString()} - https://coderadio-admin.freecodecamp.org/api/live/nowplaying/coderadio is being fetched for the song metadata\n${new Date().toISOString()} - https://coderadio-relay-blr.freecodecamp.org/radio/8010/radio.mp3 is being fetched for the live song`, function (err) {
            if (err) {
                return console.error(err);
            }
        });
        check();
        interval = setInterval(function () { check(); }, 3000);
    }
    else if (document.getElementById('play-pause').innerHTML.trim().startsWith('<img id="pause"')) {
        document.getElementById('play-pause').innerHTML = '<img id="play" class="icon" srcset="icons/play.svg" draggable="false" style="padding-top: 20px;cursor: pointer;" />';
        x.pause();
        fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - The player has been paused\n', function (err) {
            if (err) {
                return console.error(err);
            }
        });
        clearInterval(interval);
    }
});

document.getElementById('add').addEventListener('click', () => {
    const adder = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            devTools: false,
        },
        height: 410,
        width: 400,
        frame: false,
        resizable: false,
    });
    adder.loadFile('settings/add.html');
});

//  batery status
let batt;
navigator.getBattery().then(battery => {
    updateBattery();

    battery.addEventListener('chargingchange', () => { updateBattery(); });
    battery.addEventListener('levelchange', () => { updateBattery(); });

    function updateBattery() {
        var elem = document.getElementById('batt');
        var elem1 = document.getElementById('zap');
        if (battery.charging) {
            elem1.innerHTML = '<img class="icon" style="transform: scale(1.5)" srcset="icons/zap.svg" draggable="false" />';
        }
        else {
            elem1.innerHTML = '';
        }
        elem.style.width = `${parseInt(battery.level * 100)}%`;
        batt = parseInt(battery.level * 100);
    }
});

document.getElementById('battprog').addEventListener('mouseover', () => {
    // eslint-disable-next-line no-undef
    tippy(document.getElementById('battprog'), {
        content: `${batt}% battery`,
    });
});

document.getElementById('zap').addEventListener('mouseover', () => {
    // eslint-disable-next-line no-undef
    tippy(document.getElementById('zap'), {
        content: 'Charging',
    });
});

let currentwifi;
var wifi = require('node-wifi');
// Initialize wifi module
// Absolutely necessary even to set interface to null
wifi.init({
    // network interface, choose a random wifi interface if set to null
    iface: null,
});
wifi.getCurrentConnections((error, currentConnections) => {
    if (error) {
        fs.appendFile('debug/logs.txt', new Date().toISOString() + ' - node-wifi error - ' + error + '\n', function (err) {
            if (err) {
                return console.error(err);
            }
        });
    }
    else {
        currentwifi = currentConnections[0]['ssid'];
    }
});

document.getElementById('wifipng').addEventListener('mouseover', () => {
    // eslint-disable-next-line no-undef
    tippy(document.getElementById('wifipng'), {
        content: currentwifi,
    });

});

document.getElementById('canvas').addEventListener('mouseover', () => {
    // eslint-disable-next-line no-undef
    tippy(document.getElementById('canvas'), {
        content: (new Date().getHours() >= 12) ? 'PM' : 'AM',
    });
});

document.getElementById('canvas-1').addEventListener('mouseover', () => {
    // eslint-disable-next-line no-undef
    tippy(document.getElementById('canvas-1'), {
        content: (new Date().getUTCHours() + 1 >= 12) ? 'PM' : 'AM',
    });
});

document.getElementById('fcountry').addEventListener('mouseover', () => {
    // eslint-disable-next-line no-undef
    tippy(document.getElementById('fcountry'), {
        content: 'Click to select other countries',
    });
});

var country_list = require('./settings/countries.json');
country_list.countries.forEach(element => {
    document.getElementById('fcountry').innerHTML += `<option value=${element.name}>${element.name}</option>`;
});

//  To change the clock as per the user requires
document.getElementById('fcountry').selectedIndex = put_country.position;
document.getElementById('fcountry').addEventListener('click', () => {
    var country = document.getElementById('fcountry');
    //  get the text of the selected option
    var text = country.options[country.selectedIndex].text;
    //  fetch the offset timings from the json file
    var utc_by_country = require('./settings/countries.json');
    utc_by_country.countries.forEach(element => {
        //  check if the name of the country selected is in the json file
        if (element.name.toLowerCase() == text.toLowerCase()) {
            utc_hour = parseInt(element.timezone_offset.toString().split('.')[0]);
            //  we add a + "0" because the decimal is read as 3 instead of 30
            utc_minute = element.timezone_offset.toString().split('.')[1];
            if (utc_minute) {
                if (utc_minute.length == 1) {
                    utc_minute = parseInt(element.timezone_offset.toString().split('.')[1] + '0');
                }
                else {
                    utc_minute = parseInt(element.timezone_offset.toString().split('.')[1]);
                }
            }
            //  sometimes is the number is 5.00 it is read as only 5 and the second element in the array does not exist
            //  hence we use this to check the minute
            else {
                utc_minute = 0;
            }
            fs.readFile('settings/store.json', 'utf8', function readFileCallback(err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    //  now it is an object
                    var obj = JSON.parse(data);
                    //  edit the data
                    obj.utc_hour = utc_hour;
                    obj.utc_minute = utc_minute;
                    obj.position = country.selectedIndex;
                    //  convert it back to json
                    var json = JSON.stringify(obj, null, 2);
                    fs.writeFile('settings/store.json', json, 'utf8', err => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
        }
    });
});

// From SO
var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
// January is 0!
var mm = String(today.getMonth() + 1).padStart(2, '0');
var yyyy = today.getFullYear();

today = dd + '/' + mm + '/' + yyyy;
document.getElementById('date').innerHTML = today;
