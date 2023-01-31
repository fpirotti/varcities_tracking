<?php

require 'functions.php';

if( !isset($_POST['uid']) || $_POST['uid']==""){  
   header('Content-type: application/json');
    echo json_encode( array("error"=> " No UID found!"));
    exit(-1);
}
removeOldFiles($_POST['uid']);
$dirname = "tmp/". $_POST['uid']   ;

if( !is_dir($dirname)){
    header('Content-type: application/json'); 
    echo json_encode( array("success"=>$dirname. " First-time user, welcome!"));
    exit(0);
}
 
if(   count($_POST['startTimes']) <1 ){  
   header('Content-type: application/json');
    echo json_encode( array("success"=> " No files to sync!"));
    exit(-1);
}
 
if( !is_array($_POST['startTimes']) || count($_POST['startTimes']) <1 ){  
   header('Content-type: application/json');
    echo json_encode( array("warning"=> " Files to sync are not as list!"));
    exit(-1);
}
foreach ($_POST['startTimes'] as $startTime ) {
   
    $tdate = date('Ymd_His', $startTime/1000); 
    $tmpfname = $dirname . "/" . $tdate;
    $tmpfnamez = $tmpfname .".zip";

    if (is_file($file)) {
      if ($now - filemtime($file) >= 60 * 60 * 24 * 1) { // 2 days
        unlink($file);
      }
    }
}
  
   
 

$fin=array();
for ($x = 0; $x < count($_POST['data']['y']); $x++) {
  $fin[]='{ "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [ '.  $_POST['data']['x'][$x].  ',   '.  $_POST['data']['y'][$x].  '  ]},
        "properties": {"ac":  '.  $_POST['data']['a'][$x].  '}
        }'. PHP_EOL; 
}
file_put_contents($tmpfname,   '{ "type": "FeatureCollection",
    "features": [ '.  implode(',
', $fin)  .' ]
}' );

 
// $fin="";
// for ($x = 0; $x < count($_POST['data']['y']); $x++) {
//   $fin = $fin . PHP_EOL . $_POST['data']['x'][$x] ."\t".$_POST['data']['y'][$x];
// }
// file_put_contents($tmpfname,   "#File with tab as column separator. ".PHP_EOL."#Geo start Date and time:".  date('l jS \of F Y h:i:s A', $tim) .PHP_EOL ."Latitude\tLongitude". $fin );
 
chmod($tmpfname, 0777);

$zip = new ZipArchive();
$zip->open($tmpfnamez, ZipArchive::CREATE);
$zip->addFile($tmpfname, basename($tmpfname) );
$zip->close();
unlink($tmpfname);
header('Content-type: application/json');
echo json_encode( array("success"=>basename($tmpfnamez) ));

?>
