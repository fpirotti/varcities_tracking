 

if (localStorage.getItem("uid") === null) {
 localStorage.setItem('uid', (Math.random() + 1).toString(36).slice(2) );
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
let maxacc=0;

var N = 10; 

let locationData = { x: [],  y:[], a:[], st: 0, fp :0};
let surveys = {};
const geojson =   { "type": "FeatureCollection",
    "features": [ ]
}; 

let accthreshold = document.getElementById('accthresh');
updateLogger("Welcome, your unique id is: "+uid, 'logger', newline=false);
const getmotion=false;
const getlocation=true;
const realTime=true;
let realTimeOk =true;
const visible = true;
$('#man').hide();


$("#file-input").on("change", function (e) {
  var file = $(this)[0].files[0];
  ///////// upload image ------
  var upload = new Upload(file);

  upload.doUpload();
});
$('#file-button').click(function(){
  $('#file-input').click();
});
if(!getmotion) $('#accel').hide();

function successLocationListen(pos) {
  const crd = pos.coords; 
  surveys[startTime]['x'].push(crd.longitude);
  surveys[startTime]['y'].push(crd.latitude);
  surveys[startTime]['a'].push(crd.accuracy);
   
  coordCounter=coordCounter+1;
  if(realTime){
    sendRTdata(uid, startTime, crd);
  }
  if(visible){
  updateFieldIfNotNull('geoloc_lat', crd.latitude, 8);
  updateFieldIfNotNull('geoloc_lng', crd.longitude, 8);
  updateFieldIfNotNull('geoloc_acc', crd.accuracy, 1);
  updateFieldIfNotNull('geoloc_n', coordCounter, 0); 
  }
}

function errorLocationListen(e) {
  alert(e.message + " - tracking will be stopped.");
  demo_button.dispatchEvent(new Event('click'));
}

var slider = document.getElementById("accthresh");
var output = document.getElementById("accthreshvalue");
output.innerHTML = slider.value; // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  output.innerHTML = this.value;
}

var slider2 = document.getElementById("geoloc_freq");
var output2 = document.getElementById("geoloc_freq_value");
output2.innerHTML = slider2.value; // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
slider2.oninput = function() {
  output2.innerHTML = this.value  ;
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

function handleOrientation(event) {
  updateFieldIfNotNull('Orientation_a', event.alpha);
  updateFieldIfNotNull('Orientation_b', event.beta);
  updateFieldIfNotNull('Orientation_g', event.gamma);
 // incrementEventCount();
}

function incrementEventCount(){
  let counterElement = document.getElementById("num-observed-events")
  let eventCount = parseInt(counterElement.innerHTML)
  counterElement.innerHTML = eventCount + 1;
}

function updateFieldIfNotNull(fieldName, value, precision=10, force=false){
  if(force) {
    document.getElementById(fieldName).innerHTML = value.toFixed(precision);
  } else { 
  if (value != null && visible)
    document.getElementById(fieldName).innerHTML = value.toFixed(precision); 
  }
}

function handleMotion(event) { 
  updateFieldIfNotNull('Accelerometer_x', event.acceleration.x);
  updateFieldIfNotNull('Accelerometer_y', event.acceleration.y);
  updateFieldIfNotNull('Accelerometer_z', event.acceleration.z);
  var mm = event.acceleration.x+event.acceleration.y+event.acceleration.z;
  if(maxacc<mm){
    maxacc=mm;
    updateFieldIfNotNull('Accelerometer_max',mm, 2,   true);
  }
  updateFieldIfNotNull('Accelerometer_i', event.interval, 2);
 
//  incrementEventCount();
}

let is_running = false;
let demo_button = document.getElementById("start_demo");
demo_button.onclick = function(e) {
  e.preventDefault();
  
  // Request permission for iOS 13+ devices
  if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    DeviceMotionEvent.requestPermission();
  }
  
  
  
  
  
  /////////////////////////  
  if (is_running){
    window.removeEventListener("devicemotion", handleMotion);
    //window.removeEventListener("deviceorientation", handleOrientation);
    
    document.getElementById("start_demo_txt").innerHTML = "  SAVING TRACK             ";
     demo_button.classList.add('btn-warning');
     demo_button.classList.remove('btn-danger'); 
    
      updateLogger("Stopped recording");
      
      var geojson2=geojson;
       for(var i=0; i< surveys[startTime]['x'].length; i++){
             geojson2.features.push({ "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [ surveys[startTime]['x'][i] , surveys[startTime]['y'][i] ]},
        "properties": {"ac": surveys[startTime]['a'][i] }
        }); 
      }
      //var bb = new Blob([JSON.stringify(geojson2) ], { type: 'application/geo+json' });
//       var bb = new Blob([JSON.stringify(geojson2) ], { type: 'application/geo+json' });
      getZipFileBlob().then(  downloadFile  );

      async function getZipFileBlob() {
        const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/octet-stream"));
        await Promise.all([
          zipWriter.add(startDate.yyyymmdd() +'.geojson',  new zip.TextReader(JSON.stringify(geojson2))) 
        ]);
        return zipWriter.close();
      }

      function downloadFile(blob) {
        sendBlobData(uid, startTime, blob) ; 
        var newa = Object.assign(document.createElement("a"), {
          download: startDate.yyyymmdd() +'.zip',
          href: URL.createObjectURL(blob),
          textContent: "Download  ==>> "+startDate.yyyymmdd() +'.zip <<==',
          style:'display: block; color:red;font-weight:900;'
        });
        $('#logger').append( newa ); 
        var objDiv = document.getElementById("logger");
        objDiv.scrollTop = objDiv.scrollHeight+10;
         
        document.getElementById("start_demo_txt").innerHTML = "     START TRACKING         ";
        demo_button.classList.add('btn-success');
        demo_button.classList.remove('btn-warning');
        document.getElementById("spinner").classList.add('invisible');
        alert("GeoJSON file ready for download in log panel.");
      }
 
     
    clearInterval(interval); 
    is_running = false;
  }else{
    
    updateLogger("Starting tracking");
    if(getmotion) window.addEventListener("devicemotion", handleMotion);
    //window.addEventListener("deviceorientation", handleOrientation);
    document.getElementById("start_demo_txt").innerHTML = "      STOP TRACKING         ";
    document.getElementById("spinner").classList.remove('invisible');
    demo_button.classList.remove('btn-success');
    demo_button.classList.add('btn-danger');
    
    startDate =  new Date();
    startTime = Date.now();
    surveys[startTime]=locationData;
     
    interval = setInterval(function() {
      navigator.geolocation.getCurrentPosition(successLocationListen, errorLocationListen, options);
    }, parseFloat(document.getElementById('geoloc_freq').value)*1000 );

    is_running = true;
  }
};
