if (localStorage.getItem("uid") === null) {
    localStorage.setItem('uid', (Math.random() + 1).toString(36).slice(2));
}

const uid = localStorage.getItem('uid'); //returns 4587ff526d
var startTime;

const options = {
    enableHighAccuracy: true,
    timeout: 60000,
    maximumAge: 0
};

var utf8EncodedString = new TextEncoder("utf-8").encode(uid);
const buffer = new ArrayBuffer(10+8+4+4+4+4); // 10=uid, 8=starttime timestamp long uint, 4x4 are lat long acc elapsed time

const uidBuff = new Uint8Array(buffer, 24, 10);
const starTimeBuff = new BigUint64Array(buffer, 0, 1);
const dataBuff = new Uint32Array(buffer, 8, 4);
uidBuff.set(utf8EncodedString);

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
let realTimeOk = true;
let isWakeSupported = false;
const visible = true;
$('#man').hide();
let wakeLock = null;


if ('wakeLock' in navigator) {
    isWakeSupported = true;
    updateLogger('Screen Wake Lock API supported!');
    // create an async function to request a wake lock

} else {
    updateLoggerWarn('Wake lock is not supported by this browser.');
}
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
                    updateLoggerErr(altstr + " ... " +
                        " <a href='https://www.google.com/search?q=activate+geotagging+in+photoes+smartphone&ei=v9rbY5qeD8iHxc8P5qKUyAw&ved=0ahUKEwja-cK0l_f8AhXIQ_EDHWYRBckQ4dUDCA8&uact=5&oq=activate+geotagging+in+photoes+smartphone&' target='_blank'>" +
                        "Click HERE for help</a>");

                } else {
                    upload.doUpload();
                }
            } else {
                alert("No EXIF data or GPS data found in image '" + file.name + "'!! Please check your phone settings.");
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


let is_running = 10;
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
/////////////////////////
start_tracking_button.onclick = function (e) {
    e.preventDefault();
    is_running++;
    if(is_running > 2) {
        is_running = 0;
    }
    if(!isLocationEnabled){
        clearInterval(interval);
        is_running = 0;
        updateLoggerErr("Please reactivate location permissions, otherwise the app will not work!");
        return(0);
    }
    
    
    if (is_running) {

        clearInterval(interval);
        


        if(is_running==1){

            if(wakeLock) wakeLock.release()
                .then(() => {
                    wakeLock = null;
                    updateLogger("Wakelock released");
                });

            window.removeEventListener("devicemotion", handleMotion);
            //window.removeEventListener("deviceorientation", handleOrientation);

            start_tracking_button_txt.innerHTML = "  SAVING TRACK             ";
            start_tracking_button.classList.add('btn-warning');
            start_tracking_button.classList.remove('btn-danger');

            updateLogger("Stopped recording... saving file");


            var geojson2 = geojson;
            for (var i = 0; i < surveys[startTime]['x'].length; i++) {
                const dd = new Date( surveys[startTime]['time'][i] );
                geojson2.features.push({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [surveys[startTime]['x'][i], surveys[startTime]['y'][i]]},
                    "properties": {"ac": surveys[startTime]['a'][i], "timestamp":String( dd.toJSON()) }
                });
            }

            getZipFileBlob(geojson2).then(uploadGeoJSONblob);
        } else {
            start_tracking_button_txt.innerHTML = "     START TRACKING         ";
            start_tracking_button.classList.add('btn-success');
            start_tracking_button.classList.remove('btn-warning');
            start_tracking_button.classList.remove('btn-danger');
            document.getElementById("spinner").classList.add('invisible');
        }

    } else {

        updateLogger("Starting to track");
        coordCounter = 0;
        try {
            wakeLock =   navigator.wakeLock.request('screen').then(
                function(prom){
                    wakeLock=prom;
                }
            );

            updateLogger('Wake Lock is active!');
        } catch (err) {
            updateLogger( `${err.name}, ${err.message}`);
        }
        if (getmotion) window.addEventListener("devicemotion", handleMotion);
        //window.addEventListener("deviceorientation", handleOrientation);
        start_tracking_button_txt.innerHTML = "      STOP TRACKING         ";
        document.getElementById("spinner").classList.remove('invisible');
        start_tracking_button.classList.remove('btn-success');
        start_tracking_button.classList.add('btn-danger');

        startDate = new Date();
        startTime = Date.now();
        starTimeBuff[0] = BigInt(startTime);
        surveys[startTime] = locationData;

        interval = setInterval(function () {
            navigator.geolocation.getCurrentPosition(successLocationListen, errorLocationListen, options);
        }, parseFloat(document.getElementById('geoloc_freq').value) * 1000);

    }
};
