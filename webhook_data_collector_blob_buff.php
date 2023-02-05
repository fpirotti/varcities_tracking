<?php

$entityBody = file_get_contents('php://input');
$data = mb_strcut($entityBody , 18, mb_strlen($entityBody, '8bit') );
$startTime = unpack("Q", mb_strcut($entityBody , 10, 18 ) );

$POST = Array('startTime'=>$startTime[1] ,
                     'blob'=>unpack("l*", $data),
                      'uid'=>  mb_strcut($entityBody , 0, 10   ),
                    );

file_put_contents('sss.txt',  $entityBody  . '--' . mb_strlen($entityBody, '8bit') . '--
' . print_r($POST, True) );

header('Content-type: application/json');
require 'functions.php';


if( !isset($POST['uid']) || $POST['uid']==""){
    echo json_encode( array("error"=> " No UID found!"));
    exit(-1);
}

$dirname = "incoming/geojson/". $POST['uid']   ;
$dirname2 = "incoming/rt/". $POST['uid']   ;

if( !is_dir($dirname)){
  if(!mkdir($dirname, 0777, True)){
    echo json_encode( array("error"=>$dirname. " not able to create this directory."));
    exit(-1);
  }
}

if( !is_dir($dirname2)){
    if(!mkdir($dirname2, 0777, True)){
        echo json_encode( array("error"=>$dirname2. " not able to create this directory."));
        exit(-1);
    }
}

if( !isset($POST['startTime'])){
    echo json_encode( array("error"=> " No startTime found!"));
    exit(-1);
  }
  
$tim = Date($POST['startTime']/1000);
$tdate = date('Ymd_His', $POST['startTime']/1000);

$tmpfname = $dirname . "/" . $tdate;
$tmpfnameb = $dirname2 . "/" . $tdate .".bin";
$tmpfnamez = $tmpfname .".zip";
 
 

 
    if (  !isset($POST['blob'] )   ) {
    echo json_encode( array("error"=> " No data in php -- ."));
    exit(-1);
    }

if(!file_put_contents($tmpfnameb,  $data ) ){
    header('Content-type: application/json');
    echo json_encode( array("error"=> " cannot write to file"));
    exit(0);
}

createGeoJSON2($POST['blob'], $tim , $tmpfname);

chmod($tmpfname, 0777);

$zip = new ZipArchive();
$zip->open($tmpfnamez, ZipArchive::CREATE);
$zip->addFile($tmpfname, basename($tmpfname) );
$zip->close();
//unlink($tmpfname);


chmod($tmpfnamez, 0777);
chmod($tmpfnameb, 0777);

echo json_encode( array("success"=>basename($tmpfnamez)   ));

?>
