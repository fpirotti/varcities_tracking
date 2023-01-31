<?php
 
session_start(); 
if(!isset( $_SESSION['startTime']) || $_SESSION['startTime']!=$_POST['startTime'] ||  $_SESSION['uid'] !=$_POST['uid']  || !isset($_SESSION["fpath"] ) || ctype_space($_SESSION["fpath"]) ||  $_SESSION["fpath"]==="" ){
  
  
  $_SESSION["dirname"]= "rt/". $_POST['uid']    ;
  $dirname=$_SESSION["dirname"];
  $_SESSION['startTime']=$_POST['startTime'];
  $_SESSION['uid'] =$_POST['uid'] ;
  if( !is_dir($dirname)){
    if(!mkdir($dirname)){ 
      header('Content-type: application/json'); 
      echo json_encode( array("error"=>$dirname. " not able to create this directory."));
      exit(-1);
    }
  }
   
  if( !isset($_POST['data']['longitude'])){  
    header('Content-type: application/json');
      echo json_encode( array("error"=> " No data found!"));
      exit(-1);
    }
     
  if( !isset($_POST['startTime'] ) ){  
    header('Content-type: application/json');
      echo json_encode( array("error"=> " No starttime found!"));
      exit(-1);
    }
     
    $tdate = date('Ymd_His', $_POST['startTime']/1000);

    $tmpfname = $dirname . "/" . $tdate; 
   $_SESSION["fpath"] = $tmpfname .".csv"; 
}

if(!file_put_contents($_SESSION["fpath"],  $_POST['data']['longitude'].'|'.$_POST['data']['latitude'].'|'.round($_POST['data']['accuracy']).PHP_EOL , FILE_APPEND | LOCK_EX) ){
    header('Content-type: application/json');
      echo json_encode( array("error"=> " cannot write to file"));  
}
 
  

  
?>
