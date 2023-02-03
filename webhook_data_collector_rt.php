<?php

  $entityBody = file_get_contents('php://input');
  $data = mb_strcut($entityBody , 8, 16);

  $POST= unpack("QstartTime/LtimeElapsed/LLongitude/LLatitude/LAccuracy", $entityBody);
  $POST['uid'] = mb_strcut($entityBody , 24, mb_strlen($entityBody, '8bit') );


  session_start();
  if(        !isset( $_SESSION['startTime']) ||
             $_SESSION['startTime'] != $POST['startTime'] ||
             $_SESSION['uid'] !=$POST['uid']  || !isset($_SESSION["fpath"] ) || ctype_space($_SESSION["fpath"]) ||
             $_SESSION["fpath"]==="" ){


    $_SESSION["dirname"]= "incoming/rt/". $POST['uid']    ;
    $dirname=$_SESSION["dirname"];
    $_SESSION['startTime']=$POST['startTime'];
    $_SESSION['uid'] =$POST['uid'] ;
    if( !is_dir($dirname)){
      if(!mkdir($dirname, 0777, True)){
        header('Content-type: application/json');
        echo json_encode( array("error"=>$dirname. " not able to create this directory."));
        exit(-1);
      }
    }

    if( !isset($POST['startTime'] ) ){
      header('Content-type: application/json');
        echo json_encode( array("error"=> " No starttime found!"));
        exit(-1);
      }

      $tdate = date('Ymd_His', $POST['startTime']/1000);

      $tmpfname = $dirname . "/" . $tdate;
     $_SESSION["fpath"] = $tmpfname .".bin";
  }

  // if(!file_put_contents($_SESSION["fpath"],  $_POST['data']['longitude'].'|'.$_POST['data']['latitude'].'|'.round($_POST['data']['accuracy']).'|'.$_POST['data']['time'].PHP_EOL ,
  //       FILE_APPEND | LOCK_EX) ){
  //     header('Content-type: application/json');
  //       echo json_encode( array("error"=> " cannot write to file"));
  // }


  if(!file_put_contents($_SESSION["fpath"],  $data , FILE_APPEND | LOCK_EX) ){
    header('Content-type: application/json');
    echo json_encode( array("error"=> " cannot write to file"));
  }



?>
