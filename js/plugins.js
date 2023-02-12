// Avoid `console` errors in browsers that lack a console.
(function () {
    var method;
    var noop = function () {
    };
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }

}());

// Place any jQuery/helper plugins in here.
var getSizeStorage = function () {
    var _lsTotal = 0,
        _xLen, _x;
    for (_x in localStorage) {
        if (!localStorage.hasOwnProperty(_x)) {
            continue;
        }
        _xLen = ((localStorage[_x].length + _x.length) * 2);
        _lsTotal += _xLen;
        console.log(_x.substr(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB")
    }

    console.log("Total = " + (_lsTotal / 1024).toFixed(2) + " KB");
    return ((_lsTotal / 1024).toFixed(2));
}


Date.prototype.yyyymmdd = function () {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    var hh = this.getHours();
    var mmm = this.getMinutes();
    var sss = this.getSeconds();

    return [this.getFullYear(),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd,
        'T',
        hh, mmm, sss
    ].join('');
};

getSizeStorage();


updateLogger = function (text, idlogger = 'logger', newline = true) {
    const d = new Date();
    let dd = d.toLocaleTimeString();
    $('#' + idlogger).append((newline ? "<br>" : "") + dd + "<br> - " + text);
    $('#' + idlogger).scrollTop($('#' + idlogger).attr("scrollHeight"));
    var objDiv = document.getElementById(idlogger);
    objDiv.scrollTop = objDiv.scrollHeight + 10;
}

updateLoggerErr = function (text, idlogger = 'logger', newline = true) {
    $('#' + idlogger).show();
    updateLogger("<span style='color:red'>" + text + "</span>", idlogger, newline);
}

updateLoggerWarn = function (text, idlogger = 'logger', newline = true) {
    $('#' + idlogger).show();
    updateLogger("<span style='color:orange'>" + text + "</span>", idlogger, newline);
}

updateLoggerAlert = function (text, typeAlert = 0, forceLog = 0) {
    var tt = "alert-primary";
    if (typeAlert === 1) {
        if (forceLog !== 0) {
            updateLogger(text);
        }
        tt = "alert-success";
    }
    if (typeAlert === 2) {
        if (forceLog !== 0) {
            updateLoggerWarn(text);
        }
        tt = "alert-warning";
    }
    if (typeAlert === 3) {
        if (forceLog !== 0) {
            updateLoggerErr(text);
        }
        tt = "alert-danger";
    }

    if (forceLog < 2) {
        var alert = document.createElement("div");
        alert.className = `alert  ${tt}`;
        //alert.id = "alertID";
        alert.textContent = text;
        alert.addEventListener('click', function () {
            $(this).fadeOut(400)
        });
        document.getElementById('mainTAG').appendChild(alert);
        alert.style.marginTop = "1rem";
        setTimeout(function () {
            $(alert).fadeOut(1000, function () {
                $(alert).remove()
            });
        }, 10000);
    }

}

saveToLocalStorage = function (uid, startTime, blob) {
    var blobs = localStorage.getItem("blobs");
    if (blobs === null) {
        var blobs = {};
        blobs[startTime] = blob;
        localStorage.setItem('blobs', blobs);
    } else {
        var times2sync = Object.keys(blobs);
        updateLogger(JSON.stringify(blobs[0]) + " tracks not uploaded yet");
        blobs[startTime] = blob;
        localStorage.setItem('blobs', blobs);
    }
    updateLogger("Track saved to localStorage for future upload. ");
}


syncLocalStorage = function () {
    // localStorage.setItem(startTime, blob );
}

sendGeoJsonBlobDataToServer = function (uid, startTime, blob) {
    var data = new FormData();
    data.append('blob', blob);
    data.append('uid', uid);
    data.append('startTime', startTime);

    var promise = $.ajax({
        type: 'POST',
        url: 'https://www.cirgeo.unipd.it/varcities/webhook_data_collector_blob.php',
        data: data,
        contentType: false,
        processData: false,
        success: function (data) {
            //updateLogger("Server  available - data sent.");
        },
        error: function () {
            start_tracking_button.click();
            saveToLocalStorage(uid, startTime, blob);
            updateLoggerAlert("Server is not available - data stored locally. If this is unexpected, contact the developer.", 3);
        }
    });


    promise.success(function (data) {

        start_tracking_button.click();
        if (data.error !== undefined) {
            updateLoggerAlert("Error uploading GeoJSON to server: " + data.error, 3);
        } else {
            updateLoggerAlert("GeoJSON successfully uploaded to server.", 0);
        }


    });

}


sendGeoJsonBlobDataToServerBuff = function (uid, startTime, buff) {


    const blob = new Blob([uid, starTimeBuff, buff], {type: "application/octet-stream"});


    var promise = $.ajax({
        type: 'POST',
        url: 'https://www.cirgeo.unipd.it/varcities/webhook_data_collector_blob_buff.php',
        data: blob,
        contentType: false, //'application/octet-stream',
        processData: false,
        success: function (data) {
            //updateLogger("Server  available - data sent.");
        },
        error: function () {
            //start_tracking_button.click();
            resetTrackButton();
            saveToLocalStorage(uid, startTime, buff);
            updateLoggerAlert("Server is not available - data stored locally. If this is unexpected, contact the developer.", 3, 1);
        }
    });


    promise.error(function (err) {
        updateLoggerAlert("GeoJSON error uploading data to server." + JSON.stringify(err), 3, 1);
        resetTrackButton();

    });

    promise.success(function (data) {

        if (data.error !== undefined) {
            updateLoggerAlert("Error uploading GeoJSON to server: " + data.error, 3, 1);
        } else {
            updateLoggerAlert("GeoJSON successfully uploaded to server.", 1);
        }
        resetTrackButton();

    });

}

sendRTdata = function (uid, startTime, crd) {

    //var formData = new FormData();
    dataBuff[0] = crd.time;
    dataBuff[1] = crd.longitude * 10000000;
    dataBuff[2] = crd.latitude * 10000000;
    dataBuff[3] = crd.accuracy * 100;


    var promise = $.ajax({
        type: 'POST',
        url: 'https://www.cirgeo.unipd.it/varcities/webhook_data_collector_rt.php',
        error: function (x, e) {
            updateLoggerErr(JSON.stringify(x) + " - error on real time update, " +
                "will terminate real time streaming!");
        },

        // async: true,
        contentType: 'application/octet-stream',
        data: buffer,
        // cache: false,
        processData: false,
        timeout: 60000
    });


    promise.success(function (data) {
        if (data.error !== undefined) {
            updateLoggerErr(data.error + " - error on real time update response, will terminate real time streaming.");
        }
    });
}

var Upload = function (file) {
    this.file = file;
};

Upload.prototype.getType = function () {
    return this.file.type;
};
Upload.prototype.getSize = function () {
    return this.file.size;
};
Upload.prototype.getName = function () {
    return this.file.name;
};
Upload.prototype.doUpload = function () {
    var that = this;
    var formData = new FormData();

    // add assoc key values, this will be posts values
    formData.append("upfile", this.file, this.getName());
    formData.append("upload_file", true);
    formData.append('uid', uid);
    formData.append('startTime', Date.now());

    $.ajax({
        type: "POST",
        url: "/varcities/webhook_data_download.php",
        xhr: function () {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', that.progressHandling, false);
            }
            return myXhr;
        },

        success: function (data) {
            updateLoggerErr(data);
            // your callback here
        },
        error: function (error) {
            updateLoggerErr(error.message);
            alert(error.message);
            // handle error
        },
        async: true,
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        timeout: 60000
    });
};

Upload.prototype.progressHandling = function (event) {
    var percent = 0;
    var position = event.loaded || event.position;
    var total = event.total;
    var progress_bar_id = "#progress-wrpe";
    if (event.lengthComputable) {
        percent = Math.ceil(position / total * 100);
    }
    // update progressbars classes so it fits your code
    $(progress_bar_id + " .progress-bar").css("width", +percent + "%");
    $(progress_bar_id + " .progress-bar").text(percent + "%");
};

function updateFieldIfNotNull(fieldName, value, precision = 10, force = false) {
    if (force) {
        document.getElementById(fieldName).innerHTML = value.toFixed(precision);
    } else {
        if (value != null && visible)
            document.getElementById(fieldName).innerHTML = value.toFixed(precision);
    }
}


function handleOrientation(event) {
    updateFieldIfNotNull('Orientation_a', event.alpha);
    updateFieldIfNotNull('Orientation_b', event.beta);
    updateFieldIfNotNull('Orientation_g', event.gamma);
    // incrementEventCount();
}

function incrementEventCount() {
    let counterElement = document.getElementById("num-observed-events")
    let eventCount = parseInt(counterElement.innerHTML)
    counterElement.innerHTML = eventCount + 1;
}

function handleMotion2(event) {
    if (event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma) {
        updateLoggerAlert("Gyro present2!", 0);
        motionClass.gyroPresent = true;
        motionClass.gyro[0] = this.gyroscope.x;
        motionClass.gyro[1] = this.gyroscope.y;
        motionClass.gyro[2] = this.gyroscope.z;
    } else {
        updateLoggerAlert("Gyro NOT present! Photo will not be oriented.", 2);
    }
}
function handleMotion(event) {

    var mm = event.acceleration.x + event.acceleration.y + event.acceleration.z;
    if (maxacc < mm) {
        maxacc = mm;
        if ($('#accelContainer').is(':visible')) {
            updateFieldIfNotNull('Accelerometer_max', mm, 2, true);
        }
    }
    if ($('#accelContainer').is(':visible')) {
        updateFieldIfNotNull('Accelerometer_i', event.interval, 2);
    }

//  incrementEventCount();
}


function successLocationListen(pos) {
    if (coordCounter > maxNumCoords) {
        start_tracking_button.click();
        var msg = "Max number of coordinates reached (" + maxNumCoords + "), will stop!";
        updateLoggerErr(msg);
    }

    const crd = pos.coords;
    crd.time = Date.now() - startTime;
    // surveys[startTime]['x'].push(crd.longitude);
    // surveys[startTime]['y'].push(crd.latitude);
    // surveys[startTime]['a'].push(crd.accuracy);
    // surveys[startTime]['time'].push(crd.time);

    dataTotBuff[coordCounter * 4] = crd.time;
    dataTotBuff[(coordCounter * 4 + 1)] = crd.longitude * 10000000;
    dataTotBuff[(coordCounter * 4 + 2)] = crd.latitude * 10000000;
    dataTotBuff[(coordCounter * 4 + 3)] = crd.accuracy * 100;

    if (realTime) {
        if (isOnline) {
            //dataBuff = dataTotBuff.slice(coordCounter*4, coordCounter*4+3);
            sendRTdata(uid, startTime, crd);
        } else {

        }
    }


    coordCounter = coordCounter + 1;
    if ((coordCounter % 1000) === 0) {
        dataTotBuff = add2TypedArrays(dataTotBuff);
    }

    if (visible && $('#geolocContainer').is(':visible')) {
        updateFieldIfNotNull('geoloc_lat', crd.latitude, 8);
        updateFieldIfNotNull('geoloc_lng', crd.longitude, 8);
        updateFieldIfNotNull('geoloc_acc', crd.accuracy, 1);
        updateFieldIfNotNull('geoloc_n', coordCounter, 0);
    }
}


function errorLocationListen(e) {
    $("#errorsLocs").html(errorLocations);
    errorLocations++;
    $("#errorsLocs").html(" (" + errorLocations + ")");
    var msg = e.message + " ... tracking is temporarily not working as  Location is not accessible yet please wait or " +
        "check your phone settings: tot errors=" + errorLocations;
    updateLoggerAlert(msg, 2, true);

}


async function getZipFileBlob(geojson2) {
    const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/octet-stream"));
    await Promise.all([
        zipWriter.add(startDate.yyyymmdd() + '.geojson', new zip.TextReader(JSON.stringify(geojson2)))
    ]);
    return zipWriter.close();
}

function uploadGeoJSONblob(blob) {
    updateLoggerAlert("GeoJSON saved in device.", 1);
    var newa = Object.assign(document.createElement("a"), {
        download: startDate.yyyymmdd() + '.zip',
        href: URL.createObjectURL(blob),
        textContent: "==>> " + startDate.yyyymmdd() + '.zip <<==',
        style: 'text-align:center; display: block; color:red;font-weight:900;'
    });
    $('#logger').append(newa);
    $('#logger').show();
    var objDiv = document.getElementById("logger");
    objDiv.scrollTop = objDiv.scrollHeight + 10;


    //sendGeoJsonBlobDataToServer(uid, startTime, blob);
}

function add2TypedArrays(a) { // a, b TypedArray of same type
    var c = new (a.constructor)(a.length + 1000);
    c.set(a, 0);
    return c;
}

class SensorFusionActivity {


    constructor(value) {

        this.tetha = 0;
        this.tetha = 0;
        this.isable = true;


    }

    endListeners() {
        window.removeEventListener("devicemotion", handleMotion2);
    }

    initListeners() {

        Promise.all([
            navigator.permissions.query({ name: "accelerometer" }),
            navigator.permissions.query({ name: "magnetometer" }),
            navigator.permissions.query({ name: "gyroscope" }),
        ]).then((results) => {
            if (results.every((result) => result.state === "granted")) {
                //this.sensor.start();
                updateLoggerAlert("App has permissions to device sensors....", 1);

                this.sensor = new AbsoluteOrientationSensor({ frequency: 60, referenceFrame: "device" });
                this.sensor.addEventListener("reading", () => {


                   this.theta = Math.asin(2*this.sensor.quaternion[0]*this.sensor.quaternion[2] -
                       2*this.sensor.quaternion[1]*this.sensor.quaternion[3]) * 180 / 3.14159;

                   this.phi = Math.atan((this.sensor.quaternion[2]*this.sensor.quaternion[3] +
                           this.sensor.quaternion[0]*this.sensor.quaternion[1]) /
                        (this.sensor.quaternion[0]*this.sensor.quaternion[0] +
                            this.sensor.quaternion[3]*this.sensor.quaternion[3] - 0.5)) * 180 / 3.14159;

                    $('#azimuth').html( this.phi.toFixed(2) );
                    $('#zenith').html(  this.theta.toFixed(2) );
                });

                this.sensor.addEventListener("error", (error) => {
                    //if (error.name === "NotReadableError") {
                    updateLoggerAlert("Problem with device orientation sensor: " + error.error, 2);
                    // }
                });

                this.sensor.start();
                // …
            } else {
                updateLoggerAlert("No permissions to use AbsoluteOrientationSensor.", 2);

            }
        });



    }

}

let motionClass = new SensorFusionActivity();
motionClass.initListeners();

function userIsTakingPicture(a) { // get image orientation and put in exif

}

const big0 = BigInt(0)
const big1 = BigInt(1)
const big8 = BigInt(8)

function bigToUint8Array(big) {
    if (big < big0) {
        // work out how long is the big int in bits and add 1
        const bits = (BigInt(big.toString(2).length) / big8 + big1) * big8
        // create a BigInt that's 100000... of length of big + 1
        const prefix1 = big1 << bits
        big += prefix1
    }
    let hex = big.toString(16)
    if (hex.length % 2) {
        hex = '0' + hex
    }
    const len = hex.length / 2
    const u8 = new Uint8Array(len)
    var i = 0
    var j = 0
    while (i < len) {
        u8[i] = parseInt(hex.slice(j, j + 2), 16)
        i += 1
        j += 2
    }
    return u8
}

const beforeUnloadListener = (event) => {
    event.preventDefault();
    return event.returnValue = '';
};