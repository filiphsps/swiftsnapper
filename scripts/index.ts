declare var $: any;
declare var Windows: any;
var views

module swiftsnapper {
    "use strict";

    export module CameraManager {
        var video;
        var mediaStream;

        export function initialize(conf) {
            video = document.getElementById('CameraPreview');

            if (mediaStream)
                mediaStream.stop();

            if (conf.frontFacing) {
                video.className = video.className + ' inverted';

                navigator['mediaDevices'].getUserMedia({
                    video: {
                        facingMode: "user"
                    },
                    audio: false
                }).then(function (stream) {
                    mediaStream = stream;
                    video['srcObject'] = stream;
                }).catch(function (error) {});
            } else {
                video.className = video.className.replace(' inverted', '');

                navigator['mediaDevices'].getUserMedia({
                    video: {
                        facingMode: "back",
                    },
                    audio: false
                }).then(function (stream) {
                    mediaStream = stream;
                    video['srcObject'] = stream;
                }).catch(function (error) { });
            }
        }

        export function takePhoto() {
            //TODO
        }
    }

    export module Application {
        export function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);
        }

        function onDeviceReady() {
            // Handle the Cordova pause and resume events
            document.addEventListener('pause', onPause, false);
            document.addEventListener('resume', onResume, false);

            CameraManager.initialize({
                'frontFacing': false
            });
        }

        function onPause() {
            // TODO: This application has been suspended. Save application state here.
        }

        function onResume() {
            CameraManager.initialize({
                'frontFacing': false
            });
        }

    }

    window.onload = function () {
        Application.initialize();

        //Init Owl Carousel
        views = $('#views');
        views.owlCarousel({
            loop: false,
            nav: false,
            dots: false,
            video: true,
            margin: 0,
            startPosition: 1,
            pullDrag: false,
            fallbackEasing: 'easeInOutQuart',
            responsive: {
                0: {
                    items: 1
                },
                1024: {
                    items: 3
                }
            }
        });
        $('#ViewSnapsBtn').on('click tap', function () {
            views.trigger('prev.owl.carousel', [300]);
        });
        $('#ViewStoriesBtn').on('click tap', function () {
            views.trigger('next.owl.carousel', [300]);
        });

        $('#CameraToggleBtn').on('click tap', function () {
            if ($('#CameraPreview').hasClass('inverted')) {
                CameraManager.initialize({
                    'frontFacing': false
                });
            } else {
                CameraManager.initialize({
                    'frontFacing': true
                });
            }
            
        });
        $('#ShutterBtn').on('click tap', function () {
            CameraManager.takePhoto();
        });
        if (Windows.Foundation.Metadata.ApiInformation.isTypePresent("Windows.Phone.UI.Input.HardwareButtons")) {
            Windows.Phone.UI.Input.HardwareButtons.addEventListener("camerapressed", function (e) {
                $('#ShutterBtn').click();
            });
        }
    }
}
