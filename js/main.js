if (localStorage.getItem("uid") === null) {
    localStorage.setItem('uid', (Math.random() + 1).toString(36).slice(2));
}

const uid = localStorage.getItem('uid'); //returns 4587ff526d
var startTime;


const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};
let interval = null;
let coordCounter = 0;
let maxacc = 0;

var N = 10;

let locationData = {x: [], y: [], a: [], st: 0, fp: 0};
let surveys = {};
const geojson = {
    "type": "FeatureCollection",
    "features": []
};

let accthreshold = document.getElementById('accthresh');
updateLogger("Welcome, your unique id is: " + uid, 'logger', newline = false);
const getmotion = false;
const getlocation = true;
const realTime = true;
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
if (!getmotion) $('#accel').hide();


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


let is_running = false;
let demo_button = document.getElementById("start_demo");
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
demo_button.onclick = function (e) {
    e.preventDefault();

    if(!isLocationEnabled){
        updateLoggerErr("Please reactivate location permissions, otherwise the app will not work!");
        return(0);
    }
    if (is_running) {

        wakeLock.release()
            .then(() => {
                wakeLock = null;
                updateLogger("Wakelock released");
            });

        window.removeEventListener("devicemotion", handleMotion);
        //window.removeEventListener("deviceorientation", handleOrientation);

        document.getElementById("start_demo_txt").innerHTML = "  SAVING TRACK             ";
        demo_button.classList.add('btn-warning');
        demo_button.classList.remove('btn-danger');

        updateLogger("Stopped recording... saving file");

        clearInterval(interval);
        is_running = false;

        var geojson2 = geojson;
        for (var i = 0; i < surveys[startTime]['x'].length; i++) {
            geojson2.features.push({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [surveys[startTime]['x'][i], surveys[startTime]['y'][i]]},
                "properties": {"ac": surveys[startTime]['a'][i]}
            });
        }
        //var bb = new Blob([JSON.stringify(geojson2) ], { type: 'application/geo+json' });
//       var bb = new Blob([JSON.stringify(geojson2) ], { type: 'application/geo+json' });
        getZipFileBlob().then(downloadFile);

        async function getZipFileBlob() {
            const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/octet-stream"));
            await Promise.all([
                zipWriter.add(startDate.yyyymmdd() + '.geojson', new zip.TextReader(JSON.stringify(geojson2)))
            ]);
            return zipWriter.close();
        }

        function downloadFile(blob) {
            sendBlobData(uid, startTime, blob);
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

            document.getElementById("start_demo_txt").innerHTML = "     START TRACKING         ";
            demo_button.classList.add('btn-success');
            demo_button.classList.remove('btn-warning');
            document.getElementById("spinner").classList.add('invisible');
            alert("GeoJSON file ready for download in log panel.");
        }


    } else {

        updateLogger("Starting tracking");

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
        document.getElementById("start_demo_txt").innerHTML = "      STOP TRACKING         ";
        document.getElementById("spinner").classList.remove('invisible');
        demo_button.classList.remove('btn-success');
        demo_button.classList.add('btn-danger');

        startDate = new Date();
        startTime = Date.now();
        surveys[startTime] = locationData;

        interval = setInterval(function () {
            navigator.geolocation.getCurrentPosition(successLocationListen, errorLocationListen, options);
        }, parseFloat(document.getElementById('geoloc_freq').value) * 1000);

        is_running = true;
    }
};
