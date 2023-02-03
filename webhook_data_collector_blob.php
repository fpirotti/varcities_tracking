<?php

header('Content-type: application/json');
require 'functions.php';
 
if( !isset($_POST['uid']) || $_POST['uid']==""){   
    echo json_encode( array("error"=> " No UID found!"));
    exit(-1);
}

removeOldFiles($_POST['uid']);
$dirname = "incoming/geojson/". $_POST['uid']   ;

if( !is_dir($dirname)){
  if(!mkdir($dirname, 0777, True)){
    echo json_encode( array("error"=>$dirname. " not able to create this directory."));
    exit(-1);
  }
}

if( !isset($_POST['startTime'])){  
    echo json_encode( array("error"=> " No startTime found!"));
    exit(-1);
  }
  
$tim = Date($_POST['startTime']/1000);  
$tdate = date('Ymd_His', $_POST['startTime']/1000);

$tmpfname = $dirname . "/" . $tdate;
$tmpfnamez = $tmpfname .".zip"; 
 
 

 
    if (
        !isset($_FILES['blob']['error']) ||
        is_array($_FILES['blob']['error'])
    ) { 
    echo json_encode( array("error"=> " Invalid parameters in php."));
    exit(-1);
    }

    // Check $_FILES['blob']['error'] value.
    switch ($_FILES['blob']['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE: 
              echo json_encode( array("error"=> " No file arrived."));
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE: 
              echo json_encode( array("error"=> " Exceeded filesize limit in php.")); 
        default:
              echo json_encode( array("error"=> " Unknown errors."));  
              exit(-1);
 
    }
 
 
    // You should name it uniquely.
    // DO NOT USE $_FILES['blob']['name'] WITHOUT ANY VALIDATION !!
    // On this example, obtain safe unique name from its binary data.
    if (!move_uploaded_file(
        $_FILES['blob']['tmp_name'],
        $tmpfnamez
    )) {
              echo json_encode( array("error"=> " File in server not save correctly.")); 
              exit(-1); 
    }

chmod($tmpfnamez, 0777);

echo json_encode( array("success"=>basename($tmpfnamez) ));

?>
