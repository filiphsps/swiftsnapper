/// <reference path="typings/winrt/winrt.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
var views

module swiftsnapper {
    "use strict";

    export module CameraManager {
        var video;
        var mediaStream;

        export function initialize(conf) {
            video = document.getElementById('CameraPreview');
            var Capture = Windows.Media.Capture;
            var mediaCapture = new Capture.MediaCapture();
            var mediaSettings = new Capture.MediaCaptureInitializationSettings();
            mediaSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.video;

            if (conf.frontFacing) {
                video.className = video.className + ' frontFacing';

                //TODO: set videoDeviceId
            } else {
                video.className = video.className.replace(' frontFacing', '');

                //TODO: set videoDeviceId
            }

            mediaCapture.initializeAsync(mediaSettings).done(function () {
                video.src = URL.createObjectURL(mediaCapture);
                video.play();
            });
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
            if ($('#CameraPreview').hasClass('frontFacing')) {
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
        if (Windows.Foundation.Metadata['ApiInformation'].isTypePresent("Windows.Phone.UI.Input.HardwareButtons")) {
            Windows['Phone'].UI.Input.HardwareButtons.addEventListener("camerapressed", function (e) {
                $('#ShutterBtn').click();
            });
        }
    }
}
