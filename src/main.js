var serviceWorkerRegistration = null;

var app = new App();


function init()
{
    // service worker
    if ( "serviceWorker" in navigator ) 
    {
        // register the service worker
        navigator.serviceWorker.register( "sw.js" ).then( ( reg ) =>
        {
            console.log( "service worker has been registered successfully" );
            serviceWorkerRegistration = reg;
        }
        ).catch( ( error ) =>
        {
            console.log( "failed to register service worker" , error );
        });
    }

    // check whether in online or offline mode
    if ( navigator.onLine )
    {
        console.log( "online mode" );
        isOnline=true;
    }
    else 
    {
        console.log( "offline mode" );
        isOnline=false;
    }

    // event listener when going online
    window.addEventListener( "online" , ( event ) =>
    {
        console.log( "online event" );
        isOnline=true;
        //updateLogger("You are online");
    });

    // event listener when going offline
    window.addEventListener( "offline" , ( event ) =>
    {
        console.log( "offline event" );
        isOnline=false;
        //updateLogger("You are offline");
    });

    // app install banner -- may not work on every platform
    window.addEventListener( "beforeinstallprompt" , ( event ) =>
    { 
          // Prevent the mini-infobar from appearing on mobile
           // event.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt = event;
            // Update UI notify the user they can install the PWA
            //showInstallPromotion();
            // Optionally, send analytics event that PWA install promo was shown.
            console.log(`'beforeinstallprompt' event was fired.`);
  
        event.userChoice.then( ( choiceResult ) =>
        { 
            console.log( choiceResult.outcome ); // either "accepted" or "dismissed"
        });
    });

    app.start();
}
