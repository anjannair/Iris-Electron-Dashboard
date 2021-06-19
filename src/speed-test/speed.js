const { performance } = require('perf_hooks');
const https = require('https');
const stats = require('./stats.js');
const fs = require('fs');
let upspeed, downspeed;
var final = {
    'download1': [],
    'upload1': [],
};

async function get(hostname, path) {
    fs.appendFile('debug/logs.txt', new Date().toISOString() + ` - Connecting to ${hostname}${path}\n`, function (err) {
        if (err) {
            return console.error(err);
        }
    });
    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname,
                path,
                method: 'GET',
            },
            (res) => {
                const body = [];
                res.on('data', (chunk) => {
                    body.push(chunk);
                });
                res.on('end', () => {
                    try {
                        resolve(Buffer.concat(body).toString());
                    }
                    catch (e) {
                        reject(e);
                    }
                });
                req.on('error', (err) => {
                    reject(err);
                });
            },
        );

        req.end();
    });
}

async function fetchServerLocationData() {
    const res = JSON.parse(await get('speed.cloudflare.com', '/locations'));

    return res.reduce((data, { iata, city }) => {
        // Bypass prettier "no-assign-param" rules
        const data1 = data;

        data1[iata] = city;
        return data1;
    }, {});
}

function fetchCfCdnCgiTrace() {
    const parseCfCdnCgiTrace = (text) =>
        text
            .split('\n')
            .map((i) => {
                const j = i.split('=');

                return [j[0], j[1]];
            })
            .reduce((data, [k, v]) => {
                if (v === undefined) return data;

                // Bypass prettier "no-assign-param" rules
                const data1 = data;
                // Object.fromEntries is only supported by Node.js 12 or newer
                data1[k] = v;

                return data1;
            }, {});

    return get('speed.cloudflare.com', '/cdn-cgi/trace').then(parseCfCdnCgiTrace);
}

function request(options, data = '') {
    let started;
    let dnsLookup;
    let tcpHandshake;
    let sslHandshake;
    let ttfb;
    let ended;

    return new Promise((resolve, reject) => {
        started = performance.now();
        const req = https.request(options, (res) => {
            res.once('readable', () => {
                ttfb = performance.now();
            });
            // eslint-disable-next-line no-empty-function
            res.on('data', () => {});
            res.on('end', () => {
                ended = performance.now();
                resolve([
                    started,
                    dnsLookup,
                    tcpHandshake,
                    sslHandshake,
                    ttfb,
                    ended,
                    parseFloat(res.headers['server-timing'].slice(22)),
                ]);
            });
        });

        req.on('socket', (socket) => {
            socket.on('lookup', () => {
                dnsLookup = performance.now();
            });
            socket.on('connect', () => {
                tcpHandshake = performance.now();
            });
            socket.on('secureConnect', () => {
                sslHandshake = performance.now();
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

function download(bytes) {
    const options = {
        hostname: 'speed.cloudflare.com',
        path: `/__down?bytes=${bytes}`,
        method: 'GET',
    };

    return request(options);
}

function upload(bytes) {
    const data = '0'.repeat(bytes);
    const options = {
        hostname: 'speed.cloudflare.com',
        path: '/__up',
        method: 'POST',
        headers: {
            'Content-Length': Buffer.byteLength(data),
        },
    };

    return request(options, data);
}

function measureSpeed(bytes, duration) {
    return (bytes * 8) / (duration / 1000) / 1e6;
}

async function measureLatency() {
    const measurements = [];

    for (let i = 0; i < 20; i += 1) {
        await download(1000).then(
            (response) => {
                // TTFB - Server processing time
                measurements.push(response[4] - response[0] - response[6]);
            },
            (error) => {
                console.log(`Error: ${error}`);
            },
        );
    }

    return [
        Math.min(...measurements),
        Math.max(...measurements),
        stats.average(measurements),
        stats.median(measurements),
        stats.jitter(measurements),
    ];
}

async function measureDownload(bytes, iterations) {
    const measurements = [];
    fs.appendFile('debug/logs.txt', new Date().toISOString() + ` - Measuring download speed for ${bytes}bytes\n`, function (err) {
        if (err) {
            return console.error(err);
        }
    });
    for (let i = 0; i < iterations; i += 1) {
        await download(bytes).then(
            (response) => {
                const transferTime = response[5] - response[4];
                measurements.push(measureSpeed(bytes, transferTime));
            },
            (error) => {
                fs.appendFile('debug/logs.txt', new Date().toISOString() + ` - Error while calculating download speed due to - ${error}\n`, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
            },
        );
    }

    return measurements;
}

async function measureUpload(bytes, iterations) {
    const measurements = [];

    fs.appendFile('debug/logs.txt', new Date().toISOString() + ` - Measuring upload speed for ${bytes}bytes\n`, function (err) {
        if (err) {
            return console.error(err);
        }
    });

    for (let i = 0; i < iterations; i += 1) {
        await upload(bytes).then(
            (response) => {
                const transferTime = response[6];
                measurements.push(measureSpeed(bytes, transferTime));
            },
            (error) => {
                fs.appendFile('debug/logs.txt', new Date().toISOString() + ` - Error while measuring upload speed due to ${error}\n`, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
            },
        );
    }

    return measurements;
}

// function logInfo(text, data) {
//     console.log(' '.repeat(15 - text.length), `${text}:`, data);
// }

// function logLatency(data) {
//     console.log('         Latency:', `${data[3].toFixed(2)} ms`);
//     console.log('          Jitter:', `${data[4].toFixed(2)} ms`);
// }

// function logSpeedTestResult(size, test) {
//     const speed = stats.median(test).toFixed(2);
//     console.log(
//         ' '.repeat(9 - size.length), size, 'speed:', `${speed} Mbps`
//     );
// }

function logDownloadSpeed(tests) {
    downspeed = stats.quartile(tests, 0.9).toFixed(2);
    //   Mbps
    final['download'] = downspeed;
}

function logUploadSpeed(tests) {
    upspeed = stats.quartile(tests, 0.9).toFixed(2);
    //  Mbps
    final['upload'] = upspeed;
}

module.exports = class Speed {
    async speedTest() {
        // eslint-disable-next-line no-unused-vars
        const [ping, serverLocationData, { ip, loc, colo }] = await Promise.all([
            measureLatency(),
            fetchServerLocationData(),
            fetchCfCdnCgiTrace(),
        ]);

        // const city = serverLocationData[colo];
        // logInfo('Server location', `${city} (${colo})`);
        // logInfo('Your IP', `${ip} (${loc})`);

        // logLatency(ping);

        const testDown1 = await measureDownload(101000, 10);
        final['download1'].push(stats.median(testDown1).toFixed(2));
        // logSpeedTestResult('100kB', testDown1);

        const testDown2 = await measureDownload(1001000, 8);
        // logSpeedTestResult('1MB', testDown2);
        final['download1'].push(stats.median(testDown2).toFixed(2));

        const testDown3 = await measureDownload(10001000, 6);
        // logSpeedTestResult('10MB', testDown3);
        final['download1'].push(stats.median(testDown3).toFixed(2));

        const testDown4 = await measureDownload(25001000, 4);
        // logSpeedTestResult('25MB', testDown4);
        final['download1'].push(stats.median(testDown4).toFixed(2));

        const testDown5 = await measureDownload(100001000, 1);
        // logSpeedTestResult('100MB', testDown5);
        final['download1'].push(stats.median(testDown5).toFixed(2));

        const downloadTests = [
            ...testDown1,
            ...testDown2,
            ...testDown3,
            ...testDown4,
            ...testDown5,
        ];
        logDownloadSpeed(downloadTests);

        const testUp1 = await measureUpload(11000, 10);
        final['upload1'].push(stats.median(testUp1).toFixed(2));
        const testUp2 = await measureUpload(101000, 10);
        final['upload1'].push(stats.median(testUp2).toFixed(2));
        const testUp3 = await measureUpload(1001000, 8);
        final['upload1'].push(stats.median(testUp3).toFixed(2));
        const uploadTests = [...testUp1, ...testUp2, ...testUp3];
        logUploadSpeed(uploadTests);
        return final;
    }
};
