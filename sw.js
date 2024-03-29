self.importScripts( "config.js" );

// cache name for cache versioning
var cacheName = "v"+serviceWorkerCacheVersion+":static";

// when the service is installed
self.addEventListener( "install" , ( event ) =>
{
	// cache all required files for offline use
	event.waitUntil( caches.open( cacheName ).then( ( cache ) =>
	{
		console.log( "sw > caching" );
		return cache.addAll( [
            "/",
			"config.js",
            "index.html",
			"manifest.json",
			"custom.css",
			"css/bootstrap.min.css",
			"css/style.css",
			"src/App.js",
			"src/main.js",
			"js/vendor/modernizr-2.8.3.min.js",
			"js/vendor/jquery-3.6.3.min.js",
			"js/vendor/long-press-event.min.js",
			"js/plugins.js",
			"js/fulltilt.min.js",
			"js/main.js",
			"js/zip.min.js",
			"img/favicon.ico",
			"img/maskable_icon_x128.png", 
			"img/maskable_icon_x192.png",
			"img/maskable_icon_x512.png"
		] );
	}));
    console.log( "sw > installed" );
    // activate the new service worker version immediately
    self.skipWaiting();
});



// when a new version of the service worker is activated
addEventListener( "activate" , ( event ) => 
{
    // delete the old cache
	event.waitUntil( caches.keys().then( ( keyList ) => Promise.all( keyList.map( ( key ) => 
	{
		if ( key !== cacheName ) return caches.delete( key );
    }))));
    console.log( "sw > activated" );
});



// when the browser fetches a URL
self.addEventListener( "fetch" , ( event ) =>
{
    // cache first caching - only go to the network if no cache match was found, other caching strategies can be used too
    event.respondWith( caches.match( event.request ).then( ( response ) => 
    {
      console.log( "sw > cache first" + location.pathname );
        return response || fetch( event.request );
    }));
});
