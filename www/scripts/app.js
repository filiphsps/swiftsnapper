var swiftsnapper;
(function (swiftsnapper) {
    "use strict";
    var Application;
    (function (Application) {
        function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);
        }
        Application.initialize = initialize;
        function onDeviceReady() {
            // Handle the Cordova pause and resume events
            document.addEventListener('pause', onPause, false);
            document.addEventListener('resume', onResume, false);
            navigator['mediaDevices'].getUserMedia({
                video: {
                    facingMode: "user"
                }
            }).then(function (stream) {
                var video = document.getElementById('CameraPreview');
                video['srcObject'] = stream;
            }).catch(function (error) {
                console.log(error.name + ": " + error.message);
            });
        }
        function onPause() {
            // TODO: This application has been suspended. Save application state here.
        }
        function onResume() {
            // TODO: This application has been reactivated. Restore application state here.
        }
    })(Application = swiftsnapper.Application || (swiftsnapper.Application = {}));
    window.onload = function () {
        Application.initialize();
        //Init Owl Carousel
        var views = $('#views');
        views.owlCarousel({
            loop: false,
            nav: false,
            dots: false,
            margin: 0,
            responsive: {
                0: {
                    items: 1
                },
                1024: {
                    items: 3
                }
            }
        });
        views.trigger('next.owl.carousel');
    };
})(swiftsnapper || (swiftsnapper = {}));
//# sourceMappingURL=app.js.map