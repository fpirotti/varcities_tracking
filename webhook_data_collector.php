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
  if(!mkdir($dirname)){ 
    header('Content-type: application/json'); 
    echo json_encode( array("error"=>$dirname. " not able to create this directory."));
    exit(-1);
  }
}
if( !isset($_POST['data']['y'])){  
   header('Content-type: application/json');
    echo json_encode( array("error"=> " No data found!"));
    exit(-1);
  }
  
$tim = Date($_POST['startTime']/1000);  
$tdate = date('Ymd_His', $_POST['startTime']/1000);

$tmpfname = $dirname . "/" . $tdate;
$tmpfnamez = $tmpfname .".zip";
$tmpfname = $tmpfname .".geojson";
 

creageGeoJSON($_POST['data'], $tmpfname);

 
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
