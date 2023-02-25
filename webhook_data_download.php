<?php
require 'functions.php';

header('Content-type: application/json');
$dirname = "incoming/imgs/". $_POST['uid']   ;


if( !is_dir($dirname)){
  if(!mkdir($dirname, 0777, True)){

    echo json_encode( array( "error" =>  $dirname . " not able to create this directory." ) );

    exit(0);
  }

    $old = umask(0);
    chmod($dirname, 0777);
    umask($old);

}

$tim = Date($_POST['startTime']/1000);
$tdate = date('Ymd_His', $_POST['startTime']/1000);

$tmpfname = $dirname . "/" . $tdate;
$tmpfnamet = $tmpfname.'__.jpg';



try {

    if (!isset($_POST['lat']) || !isset($_POST['lng'])  || !isset($_POST['azimuth'])  || !isset($_POST['zenith']) ) {
        throw new RuntimeException('On loading image, Latitude or longitude or azimuth or zenith missing in data.');
    }

    if (!isset($_POST['project']) || !isset($_POST['accuracy'])   ) {
        throw new RuntimeException('On loading image, project and accuracy missing in data.');
    }

    if (!is_numeric($_POST['lat']) || !is_numeric($_POST['lng']) ) {
        throw new RuntimeException('On loading image, Latitude or longitude  or azimuth or zenith in data are not numeric.');
    }

    // Undefined | Multiple Files | $_FILES Corruption Attack
    // If this request falls under any of them, treat it invalid.
    if (
        !isset($_FILES['upfile']['error']) ||
        is_array($_FILES['upfile']['error'])
    ) {
        throw new RuntimeException('Invalid parameters.');
    }

    // Check $_FILES['upfile']['error'] value.
    switch ($_FILES['upfile']['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            throw new RuntimeException('No file sent.');
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            throw new RuntimeException( ini_get('upload_max_filesize')  . 'Exceeded filesize limit.'. round($_FILES['upfile']['size']/1000000, 3) .' MB');
        default:
            throw new RuntimeException('Unknown errors.');
    }

    // You should also check filesize here.
    if ($_FILES['upfile']['size'] > 20000000) {
        throw new RuntimeException('Exceeded filesize limit (20 MB).'. round($_FILES['upfile']['size']/1000000, 3) .' MB');
    }

    // DO NOT TRUST $_FILES['upfile']['mime'] VALUE !!
    // Check MIME Type by yourself.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    if (false === $ext = array_search(
        $finfo->file($_FILES['upfile']['tmp_name']),
        array(
            'jpg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
        ),
        true
    )) {
        throw new RuntimeException('Invalid file format, must be an image.');
    }


    // You should name it uniquely.
    // DO NOT USE $_FILES['upfile']['name'] WITHOUT ANY VALIDATION !!
    // On this example, obtain safe unique name from its binary data.
    $tmpfname = sprintf('%s.%s',
        $tmpfname,
        $ext
    );

    if (!move_uploaded_file( $_FILES['upfile']['tmp_name'],$tmpfnamet ) ) {
        throw new RuntimeException('Failed to move uploaded file.');
    }

    if (!addGpsInfo( $tmpfnamet, $tmpfname,  $_POST['lat'],  $_POST['lng'], $_POST['azimuth'],
                                             $_POST['zenith'], $_POST['startTime'], $_POST['accuracy'],
                                             $_POST['project'] , $_POST['uid']  ) ) {
        throw new RuntimeException('Failed to add EXIF data to uploaded file.');
    }

    unlink($tmpfnamet);

    $old = umask(0);
    chmod($tmpfname, 0777);
    umask($old);

    echo json_encode( array("success" => "Image <a href='". $tmpfname ."'>". basename($tmpfname) ."</a> uploaded successfully to server, OPEN IN <a href='https://earth.google.com/web/@"  .  $_POST['lat'] . ",".$_POST['lng']."' target='_blank'> " .
    "Google Earth</a> | " .
    "<a href='https://www.google.com/maps/search/?api=1&query="  .  $_POST['lat'] . ",". $_POST['lng'] ."' target='_blank'> "  .
    "Google Maps</a>", "timetag"=>$_POST['startTime'] ) );

} catch (RuntimeException $e) {
    echo json_encode( array( "error" => $e->getMessage()  ) );
}
?>
