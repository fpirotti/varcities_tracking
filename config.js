// increase the version when uploading to create a new service worker cache name
var serviceWorkerCacheVersion = 1.202;

/*
define the environment where the app is running
local -> the app is running locally
server -> the app is running on the server
*/

var environment = "local";
var appURL = "https://www.cirgeo.unipd.it/varcities/";
var backendURL = "https://www.cirgeo.unipd.it/varcities/"; 
if ( environment == "local" )
{
	appURL = "https://www.cirgeo.unipd.it/varcities/";
	backendURL = "https://www.cirgeo.unipd.it/varcities/";
}
else if ( environment == "server" )
{
	appURL = "https://www.cirgeo.unipd.it/varcities/";
	backendURL = "https://www.cirgeo.unipd.it/varcities/";
}
