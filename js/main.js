if (localStorage.getItem("uid") === null) {
    localStorage.setItem('uid', (Math.random() + 1).toString(36).slice(2,12));
}

const uid = localStorage.getItem('uid'); //returns 4587ff526d
var startTime;

const options = {
    enableHighAccuracy: true,
    timeout: 1000,
    maximumAge: 0
};


var utf8EncodedString = new TextEncoder("utf-8").encode(uid);
const buffer = new ArrayBuffer(10+8+4+4+4+4); // 10=uid, 8=starttime timestamp long uint, 4x4 are lat long acc elapsed time


const uidBuff = new Uint8Array(buffer, 24, 10);
const starTimeBuff = new BigUint64Array(buffer, 0, 1);
const dataBuff = new Uint32Array(buffer, 8, 4);

// buffer for data size of 1000, if count is more,
var dataTotBuff = new Uint32Array(1000);

try {
    uidBuff.set(utf8EncodedString);
} catch (e) {
    console.log(e);
    updateLoggerAlert(uidBuff + " setting uid " + uid + " one " + utf8EncodedString + " returned error.", 2)
}
var errorLocations = 0;
let interval = null;
let coordCounter = 0;
let maxacc = 0;

var N = 10;

let locationData = {x: [], y: [], a: [], time:[], st: 0, fp: 0};
let surveys = {};
const geojson = {
    "type": "FeatureCollection",
    "features": []
};


let accthreshold = document.getElementById('accthresh');
updateLogger("Welcome, your unique id is: " + uid, 'logger', newline = false);
const getmotion = false;
const getlocation = true;
const maxNumCoords =  60*60*6; // six hours max
var realTime = true;

let isWakeSupported = false;
const visible = true;

let wakeLock = null;


if ('wakeLock' in navigator) {
    isWakeSupported = true;
    updateLogger('Screen Wake Lock API supported!');
    // create an async function to request a wake lock

} else {
    updateLoggerWarn('Wake lock is not supported by this browser.');
}

// event listener when going online
window.addEventListener( "online" , ( event ) =>
{
    console.log( "online event" );
    isOnline=true;
    updateLoggerAlert("You are online! ", 1);
    //updateLogger("You are online");
});
// event listener when going offline
window.addEventListener( "offline" , ( event ) =>
{
    console.log( "offline event" );
    isOnline=false;
    updateLoggerAlert("You are offline! Real time data will not be streamed", 3);
});

$("#file-input").on("input", function (e) {
    var file = $(this)[0].files[0];
    ///////// upload image ------
    var upload = new Upload(file);
    var file1 = e.target.files[0]
    if (file1 && file1.name) {
        EXIF.getData(file1, function () {
            var exifData = this.exifdata;
            if (exifData) {
                if ((typeof exifData.GPSLongitude) === "undefined") {
                    var altstr = "No  GPS data found in your image!!";
                    alert(altstr + " Please check LOG for more info.");
                    updateLoggerAlert(altstr + " ... " +
                        " <a href='https://www.google.com/search?q=activate+geotagging+in+photoes+smartphone&ei=v9rbY5qeD8iHxc8P5qKUyAw&ved=0ahUKEwja-cK0l_f8AhXIQ_EDHWYRBckQ4dUDCA8&uact=5&oq=activate+geotagging+in+photoes+smartphone&' target='_blank'>" +
                        "Click HERE for help</a>", 3, 1);

                } else {
                    upload.doUpload();
                }
            } else {
                updateLoggerAlert("No  GPS data found in image !!! Please check your phone settings.", 3,1);
            }
        });
    }

});
$('#file-button').click(function () {
    $('#file-input').click();
});
 

if (!getmotion) $('#accelContainer').hide();


var slider = document.getElementById("accthresh");
var output = document.getElementById("accthreshvalue");
output.innerHTML = slider.value; // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
slider.oninput = function () {
    output.innerHTML = this.value;
}

var slider2 = document.getElementById("geoloc_freq");
var output2 = document.getElementById("geoloc_freq_value");
output2.innerHTML = slider2.value; // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
slider2.oninput = function () {
    output2.innerHTML = this.value;
}


let is_running = 0;
let start_tracking_button = document.getElementById("start_demo");
let start_tracking_button_txt = document.getElementById("start_demo_txt");
var isLocationEnabled = false;
navigator.permissions.query({name:'geolocation'}).then((result) => {

    if (result.state === 'denied') {
        alert('Please reactivate location permissions, otherwise the app will not work!');
        updateLoggerErr("Please reactivate location permissions, otherwise the app will not work!");
        isLocationEnabled=false;
    } else {
        isLocationEnabled=true;
    }

    result.onchange = () => {
        updateLoggerErr(`geolocation permission status has changed to ${result.state}`);
        console.log(`geolocation permission status has changed to ${result.state}`);
        if (result.state === 'denied') {
            alert('Please reactivate location permissions, otherwise the app will not work!');
            isLocationEnabled = false;
        } else {
            isLocationEnabled = true;
        }
    };
});

start_tracking_button.addEventListener('long-press', function(e) {

    // stop the event from bubbling up
    e.preventDefault()
    navigator.geolocation.clearWatch(interval);
    if(is_running===0){
        updateLoggerAlert("To start tracking just tap the button.");
        return(9);
    }
    if(is_running==1) {

        is_running=0;
        try {
            wakeLock.release()
                .then(() => {
                    wakeLock = null;
                    updateLogger("Wakelock released");
                });
        } catch (error) {
            updateLoggerAlert("Wakelock .." + error, 2, 1);
            console.error(error);
            // Expected output: ReferenceError: nonExistentFunction is not defined
            // (Note: the exact output may be browser-dependent)
        }

        window.removeEventListener("devicemotion", handleMotion);
        //window.removeEventListener("deviceorientation", handleOrientation);

        if (coordCounter > 0) {
            start_tracking_button_txt.innerHTML = "  SAVING TRACK             ";
            start_tracking_button.classList.add('btn-outline-warning');
            start_tracking_button.classList.remove('btn-outline-danger');

            updateLoggerAlert("Stopped recording... saving GeoJSON locally and on server.");

            var geojson2 = JSON.parse(JSON.stringify(geojson));
            for (var i = 0; i < coordCounter; i++) {
                const dd = new Date(startTime + dataTotBuff[i * 4]);
                geojson2.features.push({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [dataTotBuff[i * 4 + 1] / 10000000, dataTotBuff[i * 4 + 2] / 10000000]
                    },
                    "properties": {"ac": dataTotBuff[i * 4 + 3] / 100, "timestamp": String(dd.toJSON())}
                });
            }
            }

            sendGeoJsonBlobDataToServerBuff(uid, startTime, dataTotBuff.slice(0, (coordCounter * 4)));
            getZipFileBlob(geojson2).then(uploadGeoJSONblob);
        }
});

resetTrackButton = function(){
    start_tracking_button_txt.innerHTML = "     START TRACKING         ";
    start_tracking_button.classList.add('btn-outline-success');
    start_tracking_button.classList.remove('btn-outline-warning');
    start_tracking_button.classList.remove('btn-outline-danger');
    $("#file-button, #manual").removeClass('disabled');
    $("#spinner").hide();
}
/////////////////////////
start_tracking_button.onclick = function (e) {

    e.preventDefault();

    if(!isLocationEnabled){

        navigator.geolocation.clearWatch(interval);
        //clearInterval(interval);
        is_running = 0;
        updateLoggerErr("Please reactivate location permissions, otherwise the app will not work!");
        return(0);
    }
    
    
    if (is_running) {
        updateLoggerAlert("To stop tracking keep button pressed for 2 seconds...",2);
    } else {

        updateLogger("Starting to track");
        $("#manual").addClass('disabled');

        coordCounter = 0;

        try {
            wakeLock =   navigator.wakeLock.request('screen').then(
                function(prom){
                    wakeLock=prom;
                }
            );
            updateLogger('Wake Lock is active!');
        } catch (err) {
            updateLogger( `Wke lock error ${err.name}, ${err.message}`);
        }

        if (getmotion) window.addEventListener("devicemotion", handleMotion);
        //window.addEventListener("deviceorientation", handleOrientation);
        start_tracking_button_txt.innerHTML = "      STOP TRACKING         ";
        $("#spinner").show();
        start_tracking_button.classList.remove('btn-outline-success');
        start_tracking_button.classList.remove('btn-success');
        start_tracking_button.classList.add('btn-outline-danger');

        startDate = new Date();
        startTime = Date.now();
        starTimeBuff[0] = BigInt(startTime);
        surveys[startTime] = locationData;
        interval = navigator.geolocation.watchPosition(successLocationListen, errorLocationListen, options);
        is_running = 1;
    }
};

updateLoggerAlert("You are using version " + serviceWorkerCacheVersion);