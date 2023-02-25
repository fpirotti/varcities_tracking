<?php
include_once("vendor/autoload.php");

use lsolesen\pel\PelEntryAscii;
use lsolesen\pel\PelEntryByte;
use lsolesen\pel\PelEntryRational;
use lsolesen\pel\PelEntryUserComment;
use lsolesen\pel\PelExif;
use lsolesen\pel\PelIfd;
use lsolesen\pel\PelJpeg;
use lsolesen\pel\PelTag;
use lsolesen\pel\PelTiff;



/**
 * Convert a decimal degree into degrees, minutes, and seconds.
 *
 * @param
 *            int the degree in the form 123.456. Must be in the interval
 *            [-180, 180].
 * @return array a triple with the degrees, minutes, and seconds. Each
 *         value is an array itself, suitable for passing to a
 *         PelEntryRational. If the degree is outside the allowed interval,
 *         null is returned instead.
 */
function convertDecimalToDMS($degree)
{
    if ($degree > 180 || $degree < - 180) {
        return null;
    }

    $degree = abs($degree); // make sure number is positive
    // (no distinction here for N/S
    // or W/E).

    $seconds = $degree * 3600; // Total number of seconds.

    $degrees = floor($degree); // Number of whole degrees.
    $seconds -= $degrees * 3600; // Subtract the number of seconds
    // taken by the degrees.

    $minutes = floor($seconds / 60); // Number of whole minutes.
    $seconds -= $minutes * 60; // Subtract the number of seconds
    // taken by the minutes.

    $seconds = round($seconds * 100, 0); // Round seconds with a 1/100th
    // second precision.

    return [
        [
            $degrees,
            1
        ],
        [
            $minutes,
            1
        ],
        [
            $seconds,
            100
        ]
    ];
}

/**
 * Add GPS information to an image basic metadata.
 * Any old Exif data
 * is discarded.
 *
 * @param string $input
 *            the input filename.
 * @param string $output
 *            the output filename. An updated copy of the input
 *            image is saved here.
 * @param float $longitude
 *            expressed as a fractional number of degrees,
 *            e.g. 12.345�. Negative values denotes degrees west of Greenwich.
 * @param float $latitude
 *            expressed as for longitude. Negative values
 *            denote degrees south of equator.
 * @param string $azimuth
 *            image azimuth.
 * @param string $zenith
 *            image zenith.
 * @param float $date_time
 *            the altitude, negative values express an altitude
 *            below sea level.
 * @param
 *            string the date and time.
 */
function addGpsInfo($input, $output,   $latitude, $longitude,  $azimuth, $zenith, $date_time, $accuracy, $project, $phoneuid)
{
    /* Load the given image into a PelJpeg object */
    $jpeg = new PelJpeg($input);

    /*
     * Create and add empty Exif data to the image (this throws away any
     * old Exif data in the image).
     */
    $exif = new PelExif();
    $jpeg->setExif($exif);

    /*
     * Create and add TIFF data to the Exif data (Exif data is actually
     * stored in a TIFF format).
     */
    $tiff = new PelTiff();
    $exif->setTiff($tiff);

    /*
     * Create first Image File Directory and associate it with the TIFF
     * data.
     */
    $ifd0 = new PelIfd(PelIfd::IFD0);
    $tiff->setIfd($ifd0);

    /*
     * Create a sub-IFD for holding GPS information. GPS data must be
     * below the first IFD.
     */
    $gps_ifd = new PelIfd(PelIfd::GPS);
    $ifd0->addSubIfd($gps_ifd);

    /*
     * The USER_COMMENT tag must be put in a Exif sub-IFD under the
     * first IFD.
     */
    $exif_ifd = new PelIfd(PelIfd::EXIF);
    $exif_ifd->addEntry(new PelEntryUserComment($project));
    $ifd0->addSubIfd($exif_ifd);


    $inter_ifd = new PelIfd(PelIfd::INTEROPERABILITY);
    $ifd0->addSubIfd($inter_ifd);

    $ifd0->addEntry(new PelEntryAscii(PelTag::DATE_TIME, $date_time));
    $tot =   $project . "|".  $longitude  . "|". $latitude . "|".   $azimuth. "|".  $zenith. "|".  $date_time. "|".  $accuracy. "|" .$phoneuid ;
    if(isset($project)) $ifd0->addEntry(new PelEntryAscii(PelTag::IMAGE_DESCRIPTION, $tot));


    $gps_ifd->addEntry(new PelEntryByte(PelTag::GPS_VERSION_ID, 2, 2, 0, 0));
    $gps_ifd->addEntry(new PelEntryAscii(PelTag::GPS_IMG_DIRECTION_REF, 'M'));
    $gps_ifd->addEntry(new PelEntryRational(PelTag::GPS_IMG_DIRECTION, $azimuth));
    $gps_ifd->addEntry(new PelEntryRational(PelTag::GPS_TRACK, $zenith));
    $gps_ifd->addEntry(new PelEntryRational(PelTag::GPS_STATUS, $accuracy));


    list ($hours, $minutes, $seconds) = convertDecimalToDMS($latitude);

    /* We interpret a negative latitude as being south. */
    $latitude_ref = ($latitude < 0) ? 'S' : 'N';

    $gps_ifd->addEntry(new PelEntryAscii(PelTag::GPS_LATITUDE_REF, $latitude_ref));
    $gps_ifd->addEntry(new PelEntryRational(PelTag::GPS_LATITUDE, $hours, $minutes, $seconds));

    /* The longitude works like the latitude. */
    list ($hours, $minutes, $seconds) = convertDecimalToDMS($longitude);
    $longitude_ref = ($longitude < 0) ? 'W' : 'E';

    $gps_ifd->addEntry(new PelEntryAscii(PelTag::GPS_LONGITUDE_REF, $longitude_ref));
    $gps_ifd->addEntry(new PelEntryRational(PelTag::GPS_LONGITUDE, $hours, $minutes, $seconds));


    /* Finally we store the data in the output file. */
    return( file_put_contents($output, $jpeg->getBytes()) );
}

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




