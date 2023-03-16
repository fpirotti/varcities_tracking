var verbose=true;
var storedTheme = localStorage.getItem('theme');
var storedThemeIsDark = false;
if(storedTheme=='dark') storedThemeIsDark=true;
var getPreferredTheme = () => {
    if (!storedThemeIsDark) {
        toggleTheme();
    }
};

var toggleTheme = function () {
    if (!storedThemeIsDark) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        storedTheme='dark';
        storedThemeIsDark=true;
       // $("#themeChbox").prop('checked', false);
    } else {
        document.documentElement.setAttribute('data-bs-theme', 'light');
        localStorage.setItem('theme', 'light');
        storedTheme='light';
        storedThemeIsDark=false;
       // $("#themeChbox").prop('checked', true);
    }
};
getPreferredTheme();
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

    return 0;


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

updateLoggerAlert = function (text, typeAlert = 0, forceLog = 0, timeoutforce=999999) {
    var tt = "alert-primary";
    var timeout = 2000;
    if (typeAlert === 1) {
        if (forceLog !== 0 || verbose) {
            console.log(text);
        }
        tt = "alert-success";
    }
    if (typeAlert === 2 ) {
        if (forceLog !== 0 || verbose) {
            console.warn(text);
        }
        timeout=5000;
        tt = "alert-warning";
    }
    if (typeAlert === 3 ) {
        if (forceLog !== 0 || verbose) {
            console.error(text);
        }
        timeout=10000;
        tt = "alert-danger";
    }



    if(timeoutforce!=999999){
        if(timeoutforce>0) {
            timeout = timeoutforce;
        }
    }
    if (forceLog < 2) {
        var alert = document.createElement("div");
        alert.className = `alert  ${tt}`;
        //alert.id = "alertID";
        alert.innerHTML = text;
        alert.addEventListener('click', function () {
            $(this).fadeOut(400)
        });
        document.getElementById('mainTAG').appendChild(alert);
        alert.style.marginTop = "1rem";
        if(timeoutforce>0){
            setTimeout(function () {
                $(alert).fadeOut(1000, function () {
                    $(alert).remove()
                });
            }, timeout);
        }


    }

}

deleteElementFromLocalStorage = function(idx){
    let tx1 = db.transaction("geocatchStoredData", "readwrite");
    let store1 = tx1.objectStore("geocatchStoredData");

    const objectStoreRequest = store1.get(Number(idx));
    objectStoreRequest.onsuccess = (event) => {
        // report the success of our request
        const myRecord = objectStoreRequest.result;
    };
    try {
        let tt =  store1.delete( Number(idx) );
        tt.onerror = function(){
            updateLoggerAlert(tt.error, 3, 1);
        }
        tt.onsuccess= function(){
            if(verbose)  console.log(tt);
            if(verbose)  updateLoggerAlert("Successfully deleted store with key:" + idx, 1);
        }
    } catch (e) {
        updateLoggerAlert(e.message, 3, 1);
    }
    tx1.oncomplete = function(){
        if(verbose)  console.log(tx1);
        if(verbose) updateLoggerAlert("Successfully finished DELETING over key:" + idx, 1, 1);
    }
    tx1.onerror = function(){
        updateLoggerAlert("Error - " + tx1.error, 3, 1);
    }
}

saveToLocalStorage = function (uid, startTime, blob, type, extradata={}) {

    if( typeof(type)!=='undefined' && type!='photo' && type!='track'){
        updateLoggerAlert(  'Has to be track or photo', 3, 1);
        return(0);
    }

    if(typeof(db)==='undefined'){
        updateLoggerAlert(  "DB not available, please send this message to developer", 4);
        return 0;
    }

    const tx = db.transaction("geocatchStoredData", "readwrite");
    const store = tx.objectStore("geocatchStoredData");


    var dd = {blob: blob, type: type,   timetag: startTime };
    $.each( extradata , function( key, val ) {
        if(typeof(val)==='number' || typeof(val)==='string') dd[key]=val;
    });
    const IDBRequest  = store.put(dd);
    IDBRequest.onerror = (event) => {
        updateLoggerAlert(  `There has been an error with retrieving your data: ${IDBRequest.error}`, 3, 1);
    };

    //IDBRequest.onsuccess = (event) => {
        //updateLoggerAlert(  type + " saved to IndexDB, will be synced later.", 1);
    //};

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
            //saveToLocalStorage(uid, startTime, blob, 'track');
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

};


sendGeoJsonBlobDataToServerBuff = function (uid, startTime, buff) {

    const blob = new Blob([uid, startTime, buff], {type: "application/octet-stream"});

    var promise = $.ajax({
        type: 'POST',
        url: 'https://www.cirgeo.unipd.it/varcities/webhook_data_collector_blob_buff.php',
        data: blob,
        contentType: false, //'application/octet-stream',
        processData: false
    }) ;

    promise.done(function (ret) {

        if(typeof(ret.error)!=='undefined'){
            updateLoggerAlert("Data successfully uploaded but error writing to file." + ret.error, 3, 1);
            return(0);
        }
        updateLoggerAlert("Data successfully uploaded: " + JSON.stringify(ret), 1, 1);
        deleteElementFromLocalStorage(startTime);
        resetTrackButton();
    });

    promise.fail(function (err) {
        //saveToLocalStorage(uid, startTime, blob, 'track');
        updateLoggerAlert("GeoJSON error uploading data to server." + JSON.stringify(err), 3, 1);
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


    promise.done(function (data) {
        if (data.error !== undefined) {
            updateLoggerErr(data.error + " - error on real time update response, will terminate real time streaming.");
        }
    });

    promise.fail(function (err) {
        resetTrackButton();
    });
}


var runAjaxImageUpload = function(formData, that){

    $.ajax({
        type: "POST",
        url: "webhook_data_download.php",
        xhr: function () {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', that.progressHandling, false);
            }
            return myXhr;
        },

        success: function (data) {
            if(typeof(data.success)==="undefined"){
                if(typeof(data.error)!=="undefined"){
                    updateLoggerAlert(data.error, 3, 1);
                } else {
                    updateLoggerAlert("Uknown error" + JSON.stringify(data), 3, 1);
                }
            } else {
                updateLoggerAlert(data.success, 1, 1);
                if(typeof(data.timetag)!=="undefined"){
                    deleteElementFromLocalStorage(data.timetag);
                } else {
                    updateLoggerAlert("No timetag, error " + JSON.stringify(data), 3, 1);
                }
            }

        },
        error: function (error) {
            error.message = error.message || error.statusText;
            error.message = error.message  + ' - on uploading to server, will save to storage and sync later.';
            saveToLocalStorage(that.uid, that.timetag, that.file, 'photo', that);
            if(verbose) updateLoggerAlert(error.message, 21);
 
            // handle error
        },
        async: true,
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        timeout: 60000
    });
}
var Upload = function (file, lat, lng, zenith, azimuth, uid, timetag, accuracy, project) {
    this.file = file;
    this.lat = lat;
    this.lng = lng;
    this.zenith = zenith;
    this.azimuth = azimuth;
    this.uid = uid;
    this.timetag = timetag;
    this.accuracy = accuracy;
    this.project = project;
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
    formData.append('uid', this.uid);
    formData.append('startTime', this.timetag);
    formData.append('lat', this.lat);
    formData.append('lng', this.lng);
    formData.append('azimuth', this.azimuth);
    formData.append('zenith', this.zenith);
    formData.append('accuracy', this.accuracy);
    formData.append('project', this.project);
    runAjaxImageUpload(formData, that);
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
        $('.'+fieldName).html(value.toFixed(precision));
    } else {
        if (value != null && visible)
            $('.'+fieldName).html(value.toFixed(precision));
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

function successLocationListenCamera(pos) {

    const crd = pos.coords;
    crd.time = Date.now() - startTime;
    updateFieldIfNotNull('geoloc_lat', crd.latitude, 8);
    updateFieldIfNotNull('geoloc_lng', crd.longitude, 8);
    updateFieldIfNotNull('geoloc_acc', crd.accuracy, 1);
    if(crd.accuracy>10){
        $('.geoloc_acc').css("color", "red");
    } else {
        $('.geoloc_acc').css("color", "red");
    }
}

function successLocationListen(pos) {
    if (coordCounter > maxNumCoords) {
        start_tracking_button.click();
        var msg = "Max number of coordinates reached (" + maxNumCoords + "), will stop!";
        updateLoggerErr(msg);
    }

    const crd = pos.coords;
    crd.time = pos.timestamp - startTime;

    dataTotBuff[coordCounter * 4] = crd.time;
    dataTotBuff[(coordCounter * 4 + 1)] = crd.longitude * 10000000;
    dataTotBuff[(coordCounter * 4 + 2)] = crd.latitude * 10000000;
    dataTotBuff[(coordCounter * 4 + 3)] = crd.accuracy * 100;

    if (realTime) {
        if (isOnline) {
            //dataBuff = dataTotBuff.slice(coordCounter*4, coordCounter*4+3);
            sendRTdata(uid, startTime, crd);
        }
    }


    coordCounter = coordCounter + 1;
    if ((coordCounter % 250) === 0) {
        dataTotBuff = add2TypedArrays(dataTotBuff);
        console.warn("Datatotbuff length="+dataTotBuff.length);
    }


    if ((coordCounter % 10) === 0) {
         saveToLocalStorage(uid, startTime, dataTotBuff.slice(0, (coordCounter*4)), type='track' );
        //  saveToLocalStorage(uid, startTime, dataTotBuff.slice(0, (coordCounter * 4)), type='track' );
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
    if(e==3 && errorLocations < 3){
        $("#errorsLocs").html(" (" + errorLocations + ")");
        var msg = "Geolocation not yet available, it will work when device moves.";
        updateLoggerAlert(msg, 2, true);
    }
    if(e<3) {
        $("#errorsLocs").html(" (" + errorLocations + ")");
        var msg = e.message + " ... tracking is temporarily not working as  Location is not accessible yet please wait or " +
            "check your phone settings: tot errors=" + errorLocations;
        updateLoggerAlert(msg, 2, true);
    }

}


async function getZipFileBlob(geojson2) {
    const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/octet-stream"));
    await Promise.all([
        zipWriter.add(startDate.yyyymmdd() + '.geojson', new zip.TextReader(JSON.stringify(geojson2)))
    ]);
    return zipWriter.close();
}

function uploadGeoJSONblob(blob) {
    updateLoggerAlert("GeoJSON saved in device. " + JSON.stringify(blob), 1);
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

//let motionClass = new SensorFusionActivity();
//motionClass.initListeners();


const beforeUnloadListener = (event) => {
    event.preventDefault();
    return event.returnValue = '';
};



const dbname =  location.pathname.replace(/\//g, '') + "__cache__";
let db = null;

let request = null;

const sync = function(){

    if(!isOnline){
        if(verbose) updateLoggerAlert("Device not online, will  sync you data later, when it comes back online.", 2);
        return 0;
    }
    let tx;
    try{
        tx = db.transaction("geocatchStoredData", "readonly");
    }catch (e){
        if(verbose) updateLoggerAlert("DB not ready, will not sync now", 2);
        return(false);
    }
    const store = tx.objectStore("geocatchStoredData");
    console.warn(store.getAll());
    const str = store.getAll();
    str.onsuccess = function(e) {
        var addedstr = "";
        if((str.result).length>0){
            addedstr=" will sync!";
        } else {
            updateLoggerAlert("Nothing to sync", 1);
            return 0;
        }

        updateLoggerAlert("--Store available with " + (str.result).length + ' items.' + addedstr
            , 1, 1, 3000   );



        const tx = db.transaction("geocatchStoredData", "readwrite");
        const store = tx.objectStore("geocatchStoredData");


        for(var i=0; i<str.result.length; ++i){
            //if(verbose) console.warn( str.result[i].blob.size + "--" + JSON.stringify(str.result[i]) + "--"+i);
            if( typeof(str.result[i].blob)==="undefined"   ){
                store.delete( Number(str.result[i].timetag));
                continue;
            }

            if( str.result[i].blob.length < 1   ){
                store.delete( Number(str.result[i].timetag));
                continue;
            }


            var formData = new FormData();
            formData.append("upfile", str.result[i].blob );
            formData.append("upload_file", true);
            formData.append('uid', uid);
            formData.append('startTime', str.result[i].timetag );


            for (const key in str.result[i]) {
                if(key=='blob') continue;
                formData.append(key, str.result[i][key]);
            }

            if(str.result[i].type=='photo') {
               runAjaxImageUpload(formData, this);
            } else  if(str.result[i].type=='track') {
                alert(str.result[i].blob.length);
                sendGeoJsonBlobDataToServerBuff(uid, str.result[i].timetag,
                    str.result[i].blob );
            }
        }
    }
}
const syncPrep = function(){

    if (navigator.storage && navigator.storage.estimate) {

        navigator.storage.estimate().then(
            function(quota){
                const percentageUsed = (quota.usage / quota.quota) * 100;
                console.log(`You've used ${percentageUsed}% of the available storage.`);
                const remaining = quota.quota - quota.usage;
                console.log(`You can write up to ${remaining/1000000} more Mbytes.`);
                updateLoggerAlert(`You can write up to ${ (remaining/1000000000).toFixed(0) } more GBytes.`, 1);
            }
        );

        if(request == null) request = indexedDB.open(dbname);
        request.onupgradeneeded = function() {
            // The database did not previously exist, so create object stores and indexes.
            db = request.result;
            if(verbose) updateLoggerAlert("Upgrade DB", 1);
            // if( !db.objectStoreNames.contains("geocatchStoredData") ){
            try{
                db.createObjectStore("geocatchStoredData", {keyPath: "timetag"} );
                updateLoggerAlert("Store creation successful"  , 1);
            }  catch (e) {
                updateLoggerAlert("Store creation returned error:" + e, 3);
            }
            //  }
        };

        request.onsuccess = function() {
            db = request.result;

            if( !db.objectStoreNames.contains("geocatchStoredData") ){

                const deldb = indexedDB.deleteDatabase(dbname);
                deldb.onsuccess = function(){
                    updateLoggerAlert("Successfully deleted DB, please restart APP!", 1);
                }
                deldb.onerror = function(){
                    updateLoggerAlert("Error on  deleted DB " + deldb.error +" - contact developer.", 1);
                }
            } else {
                sync();
            }

        };

        request.onerror = function(e) {
            updateLoggerAlert("DB error: "+e, 3);
        };

        request.onblocked = function(e) {
            updateLoggerAlert("DB blocked: "+e, 3);
        };

    } else {
        updateLoggerAlert("You do not have IndexDB available. Storing data offline will not work!", 3)
    }
}





const initPhoto = function() {
    // The width and height of the captured photo. We will set the
    // width to the value defined here, but the height will be
    // calculated based on the aspect ratio of the input stream.



     let smallside = $(window).width();
    //
     if( $(window).width() < $(window).height() ){
         smallside = $(window).height();
    }
    //
     smallside = smallside/2;
     smallside = smallside - 40; // 15 px padding
    // console.log(smallside);

   // $('#camera').width( smallside );
  //  $('#video').width(  smallside );

    let width = 320; // We will scale the photo width to this
    let height ; // This will be computed based on the input stream

    // |streaming| indicates whether or not we're currently streaming
    // video from the camera. Obviously, we start at false.

    let streaming = false;

    // The various HTML elements we need to configure or control. These
    // will be set by the startup() function.

    let video = null;
    let canvas = null;
    let photo = null;
    let startTimeLocal = null;
    let streamv = null;

    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    photo = document.getElementById("photo");


    // user clicks in red border ----
    $('#photoarea').off();
    $('#photoarea').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $("#photoarea").hide();
        stopVideo(streamv);
        navigator.geolocation.clearWatch(interval);
        if(typeof(orientationcontrolG)!=='undefined') {
            orientationcontrolG.stop();
        }
    });

    $("#startbutton").off();
    $("#startbutton").on(
        "click",
        function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            takepicture();
        }
    );
    function stopVideo(stream) {
        if(typeof(stream)!=='undefined'){
            stream.getTracks().forEach(function(track) {
                if (track.readyState == 'live' && track.kind === 'video') {
                    track.stop();
                }
            });
        }

    }
    function startup() {
        $("#video").off();
        clearphoto();
        video.oncanplay = () => {};
        navigator.mediaDevices
            .getUserMedia({  video: {
                    width: {   ideal: 1024  },
                    frameRate: 5,
                    facingMode: 'environment'
                }, audio: false })
            .then((stream) => {
                streamv=stream;
                video.srcObject = stream;
                video.play();
            })
            .catch(error => {
                updateLoggerAlert('An error occurred : '+ (error.name || error) +' - maybe your ' +
                    'camera is busy with another app', 3, 1);
            });

        video.oncanplay = (ev) => {
                if (!streaming) {
                    height = video.videoHeight / (video.videoWidth / width);

                    // Firefox currently has a bug where the height can't be read from
                    // the video, so we will make assumptions if this happens.

                    if (isNaN(height)) {
                        height = width / (4 / 3);
                    }
                    video.setAttribute("width", width);
                    video.setAttribute("height", height);
                    canvas.setAttribute("width", width);
                    canvas.setAttribute("height", height);
                    streaming = true;
                }
            } ;

    }

    // Fill the photo with an indication that none has been
    // captured.


    function clearphoto() {
        const context = canvas.getContext("2d");
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const data = canvas.toDataURL("image/png");
        photo.setAttribute("src", data);
    }

    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.

    async function takepicture()  {

        $('.zenith2').html($('.zenith')[0].innerHTML);
        $('.azimuth2').html($('.azimuth')[0].innerHTML);
        $('.geoloc_lat2').html($('.geoloc_lat')[0].innerHTML);
        $('.geoloc_lng2').html($('.geoloc_lng')[0].innerHTML);
        $('.geoloc_acc2').html($('.geoloc_acc')[0].innerHTML);

        startTimeLocal = Date.now();

        const videoElem = video;

      //  videoElem.srcObject = streamv;
     //   videoElem.onplaying = () => {

        // var hRatio =  width / videoElem.videoWidth     ;
        // var vRatio =  height / videoElem.videoHeight   ;
        // var ratio  = Math.min ( hRatio, vRatio );
        // canvas.height = videoElem.videoHeight ;
        // canvas.width = videoElem.videoWidth ;

        const context = canvas.getContext("2d");

        if (width && height) {
            canvas.width = videoElem.videoWidth;
            canvas.height =  videoElem.videoHeight ;
            context.drawImage(video, 0, 0 );
            const data = canvas.toDataURL("image/png");
            photo.setAttribute("src", data);
        } else {
            clearphoto();
        }

        $('#geolocsInPhoto2').show();

        $("#photo").off();
        $('#photo').on({
            'dblclick doubletap click': function(e) {
                e.stopPropagation();
                e.preventDefault();

                $('#geolocsInPhoto2').hide();
                canvas.toBlob(function(blob){
                    const up = new Upload(blob,
                        Number($('.geoloc_lat2').html()),
                        Number($('.geoloc_lng2').html()),
                        Number($('.zenith2').html()),
                        Number($('.azimuth2').html()), uid, startTimeLocal,
                        Number($('.geoloc_acc2').html()),
                        $("#projectname").val() );
                    up.doUpload();
                }, "image/jpeg")


                clearphoto();
            }
        });

    }

    // Set up our event listener to run the startup process
    // once loading is complete.
    //window.addEventListener("load", startup, false);
    startup();
};

