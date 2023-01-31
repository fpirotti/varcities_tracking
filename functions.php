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
 
function creageGeoJSON($data, $tmpfname=False){
    
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


?>


