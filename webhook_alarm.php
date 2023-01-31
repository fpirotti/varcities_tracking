<?php

require '/usr/share/php/libphp-phpmailer/src/PHPMailer.php';

require '/usr/share/php/libphp-phpmailer/src/SMTP.php';

 include_once "/usr/share/php/libphp-phpmailer/src/Exception.php";

//Declare the object of PHPMailer

$email = new PHPMailer\PHPMailer\PHPMailer();

//Set up necessary configuration to send email
$email->IsSMTP();

$email->SMTPAuth = true;
$email->SMTPDebug = 4;

$email->SMTPSecure = 'ssl';

$email->Host = "smtp.gmail.com";

$email->Port = 465;
 
//$do_debug =  DEBUG_LOWLEVEL; 
//Set the gmail address that will be used for sending email

$email->Username = "cirgeo@unipd.it";

//Set the valid password for the gmail address

$email->Password = "CirgeoLab-65";

//Set the sender email address

$email->SetFrom("varcities@varcities.eu");

//Set the receiver email address

$email->AddAddress("francesco.pirotti@unipd.it");

//Set the subject

$email->Subject = "Testing Email";

//Set email content

$email->Body = "Hello! use PHPMailer to send email using PHP";


if(!$email->Send()) {

  echo "Error: " . $email->ErrorInfo;

} else {

  echo "Email has been sent.";

}

?>
