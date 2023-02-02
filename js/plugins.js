// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
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
var getSizeStorage = function(){
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
 return((_lsTotal / 1024).toFixed(2)); 
}


Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();
  var hh = this.getHours();
  var mmm = this.getMinutes();
  var sss = this.getSeconds();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd,
          'T',
          hh, mmm, sss
         ].join('');
};
 
getSizeStorage();


updateLogger = function(text, idlogger='logger', newline=true){
    const d = new Date();
    let dd = d.toLocaleTimeString();
    $('#'+idlogger).append( (newline?"<br>":"")+ dd + "<br> - "+ text);
    $('#'+idlogger ).scrollTop($('#'+idlogger).attr("scrollHeight"));
    var objDiv = document.getElementById(idlogger);
    objDiv.scrollTop = objDiv.scrollHeight+10;
}

updateLoggerErr = function(text, idlogger='logger', newline=true){
    updateLogger("<span style='color:red'>"+text+"</span>", idlogger, newline);
}
 
updateLoggerWarn = function(text, idlogger='logger', newline=true){
    updateLogger("<span style='color:orange'>"+text+"</span>", idlogger, newline);
}
 

saveToLocalStorage = function(uid, startTime, blob){
     var blobs =   localStorage.getItem("blobs") ;
    if (blobs=== null) {
        var blobs={  };
        blobs[startTime]=blob;
        localStorage.setItem('blobs',  blobs);
    } else {
        var times2sync = Object.keys(blobs);
        updateLogger( JSON.stringify(blobs[0]) +" tracks not uploaded yet");
        blobs[startTime]=blob;
        localStorage.setItem('blobs',  blobs);
    }
    updateLogger("Track saved to localStorage for future upload. ");
}


syncLocalStorage = function(){
 // localStorage.setItem(startTime, blob );
}

sendBlobData = function(uid, startTime, blob){
           var data = new FormData(); 
          data.append('blob', blob);
          data.append('uid', uid);
          data.append('startTime', startTime);

   var promise =   $.ajax({
        type: 'POST',
        url: 'https://www.cirgeo.unipd.it/varcities/webhook_data_collector_blob.php',
        data: data, 
         contentType: false,
        processData: false,
        success: function(data) { 
          //updateLoggerWarn("Server  available - data sent.");
        },    
        error: function() {
          updateLoggerWarn("Server is not available - data stored locally. If this is unexpected, contact the developer.");
          saveToLocalStorage(uid, startTime, blob);
          alert("Server is not available - data stored locally.");
        }
    });
    
 
    promise.success(function(data){ 
        if(data.error!==undefined){ 
          updateLoggerErr(data.error);
          alert(data.error);
        }  
     });
    
}


sendRTdata = function(uid, startTime, crd){
          
   var promise =   $.ajax({
        type: 'POST',
        url: 'https://www.cirgeo.unipd.it/varcities/webhook_data_collector_rt.php',
        data: { uid:uid, startTime:startTime, data:crd}, 
        error: function (x, e) {
          realTimeOk=false;
        }
    });
    
 
    promise.success(function(data){ 
        if(data.error!==undefined){ 
          realTimeOk=false;
        } 
     });
}

var Upload = function (file) {
    this.file = file;
};

Upload.prototype.getType = function() {
    return this.file.type;
};
Upload.prototype.getSize = function() {
    return this.file.size;
};
Upload.prototype.getName = function() {
    return this.file.name;
};
Upload.prototype.doUpload = function () {
    var that = this;
    var formData = new FormData();

    // add assoc key values, this will be posts values
    formData.append("upfile", this.file, this.getName());
    formData.append("upload_file", true);
    formData.append('uid', uid);
    formData.append('startTime',    Date.now() );

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
            console.log(data);
            // your callback here
        },
        error: function (error) {
            alert(error);
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