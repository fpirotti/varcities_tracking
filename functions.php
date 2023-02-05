<?php

function removeOldFiles($uid)
{
  $files = glob("tmp/{$uid}/*");
  $now   = time();

  foreach ($files as $file) {
    if (is_file($file)) {
      if ($now - filemtime($file) >= 60 * 60 * 24 * 1) { // 2 days
        unlink($file);
      }
    }
  }
}

function createGeoJSON2($data, $startTime, $tmpfname=False){

    $fin=array();
    $tracks = count($data)/4;
    for ($x = 1; $x < ($tracks+1) ; $x++) {
        $n = $x-1;
        $ddd =date('Y-m-dTH:i:s', $data[$n*4+1]/1000 + $startTime);
        $fin[]='{ "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [ '.  ($data[$n*4+2]/10000000)  .  ',   ' .  ($data[$n*4+3]/10000000) .  '  ]},
        "properties": {"ac":  '.  ($data[$n*4+4]/100) .  ', "time":'. $ddd .'}
    }'. PHP_EOL;
}
$geojson = '{ "type": "FeatureCollection",
"features": [ '.  implode(',
    ', $fin)  .' ]
}' ;

if($tmpfname ) file_put_contents($tmpfname,   $geojson);
return($geojson);
}
function createGeoJSON($data, $tmpfname=False){
    
    $fin=array();
    for ($x = 0; $x < count($data['y']); $x++) {
    $fin[]='{ "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [ '.  $data['x'][$x].  ',   '.  $data['y'][$x].  '  ]},
            "properties": {"ac":  '.  $data['a'][$x].  '}
            }'. PHP_EOL; 
    }
    $geojson = '{ "type": "FeatureCollection",
        "features": [ '.  implode(',
    ', $fin)  .' ]
    }' ;
    
    if($tmpfname ) file_put_contents($tmpfname,   $geojson);
   return($geojson);
}

/**
 * get_image_location
 * Returns an array of latitude and longitude from the Image file
 * @param $image file path
 * @return multitype:array|boolean
 */

function gps2Num($coordPart) {

    $parts = explode('/', $coordPart);

    if (count($parts) <= 0)
        return 0;

    if (count($parts) == 1)
        return $parts[0];

    return floatval($parts[0]) / floatval($parts[1]);
}
function get_image_location($image = ''){
    $exif = exif_read_data($image, 0, true);
    if($exif && isset($exif['GPS'])){
        $GPSLatitudeRef = $exif['GPS']['GPSLatitudeRef'];
        $GPSLatitude    = $exif['GPS']['GPSLatitude'];
        $GPSLongitudeRef= $exif['GPS']['GPSLongitudeRef'];
        $GPSLongitude   = $exif['GPS']['GPSLongitude'];

        $lat_degrees = count($GPSLatitude) > 0 ? gps2Num($GPSLatitude[0]) : 0;
        $lat_minutes = count($GPSLatitude) > 1 ? gps2Num($GPSLatitude[1]) : 0;
        $lat_seconds = count($GPSLatitude) > 2 ? gps2Num($GPSLatitude[2]) : 0;

        $lon_degrees = count($GPSLongitude) > 0 ? gps2Num($GPSLongitude[0]) : 0;
        $lon_minutes = count($GPSLongitude) > 1 ? gps2Num($GPSLongitude[1]) : 0;
        $lon_seconds = count($GPSLongitude) > 2 ? gps2Num($GPSLongitude[2]) : 0;

        $lat_direction = ($GPSLatitudeRef == 'W' or $GPSLatitudeRef == 'S') ? -1 : 1;
        $lon_direction = ($GPSLongitudeRef == 'W' or $GPSLongitudeRef == 'S') ? -1 : 1;

        $latitude = $lat_direction * ($lat_degrees + ($lat_minutes / 60) + ($lat_seconds / (60*60)));
        $longitude = $lon_direction * ($lon_degrees + ($lon_minutes / 60) + ($lon_seconds / (60*60)));

        return array('latitude'=>$latitude, 'longitude'=>$longitude);
    }else{
        return false;
    }
}

?>


