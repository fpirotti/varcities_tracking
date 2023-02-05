<?php
require 'functions.php';
header('Content-Type: text/plain; charset=utf-8');

$dirname = "incoming/imgs/". $_POST['uid']   ;


if( !is_dir($dirname)){
  if(!mkdir($dirname, 0777, True)){
    echo  $dirname . " not able to create this directory.";
    exit(0);
  }
}

$tim = Date($_POST['startTime']/1000);
$tdate = date('Ymd_His', $_POST['startTime']/1000);

$tmpfname = $dirname . "/" . $tdate;




try {

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


    // GET GEOPOS
    $imgLocation = get_image_location($_FILES['upfile']['tmp_name']);

    //latitude & longitude
    $imgLat = $imgLocation['latitude'];
    $imgLng = $imgLocation['longitude'];;
    if (false === $imgLocation) {
        throw new RuntimeException('Geolocation data not found in image! Please check that your image is geotagged.');
    }
    // You should name it uniquely.
    // DO NOT USE $_FILES['upfile']['name'] WITHOUT ANY VALIDATION !!
    // On this example, obtain safe unique name from its binary data.
    $tmpfname = sprintf('%s.%s',
        $tmpfname,
        $ext
    );
    if (!move_uploaded_file( $_FILES['upfile']['tmp_name'],$tmpfname ) ) {
        throw new RuntimeException('Failed to move uploaded file.');
    }


    chmod($tmpfname, 0777);

    echo "Image uploaded successfully to server, OPEN IN <a href='https://earth.google.com/web/@"  .  $imgLat . ",".$imgLng."' target='_blank'> " .
    "Google Earth</a> | " .
    "<a href='https://www.google.com/maps/search/?api=1&query="  .  $imgLat . ",".$imgLng."' target='_blank'> "  .
    "Google Maps</a>";

} catch (RuntimeException $e) {

    echo $e->getMessage();

}
?>