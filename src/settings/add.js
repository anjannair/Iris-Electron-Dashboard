const remote = require('electron').remote;
const win = remote.getCurrentWindow();
const fs = require('fs');
document.getElementById('but-sub').addEventListener('click', () => {
    document.getElementById('form').submit();
    console.log(document.getElementById('name').value);
    fs.readFile('settings/schedule.json', 'utf8', function readFileCallback(err, data) {
        fs.appendFile('./debug/logs.txt', data, function (err) {
            if (err) {
                return console.error(err);
            }
        });
        if (err) {
            console.log(err);
        }
        else {
            // now it is an object
            var obj = JSON.parse(data);
            // edit the data
            obj.upcoming.push({
                'event': document.getElementById('name').value,
                'start': document.getElementById('start').value,
                'end': document.getElementById('end').value,
                'time': document.getElementById('time').value,
            });
            // convert it back to json
            var json = JSON.stringify(obj, null, 2);
            fs.writeFile('settings/schedule.json', json, 'utf8', err => {
                if (err) {
                    fs.appendFile('./debug/logs.txt', err, function (error) {
                        if (error) {
                            return console.error(error);
                        }
                    });
                }
            });
        }
    });
});

document.getElementById('but-can').addEventListener('click', () => {
    win.close();
});