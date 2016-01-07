/// <reference path="typings/winrt/winrt.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
var views;
var swiftsnapper;
(function (swiftsnapper) {
    "use strict";
    var CameraManager;
    (function (CameraManager) {
        var video;
        var mediaStream;
        function initialize(conf) {
            video = document.getElementById('CameraPreview');
            var Capture = Windows.Media.Capture;
            var mediaCapture = new Capture.MediaCapture();
            var mediaSettings = new Capture.MediaCaptureInitializationSettings();
            mediaSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.video;
            Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture)
                .done(function (devices) {
                if (devices.length > 0) {
                    //TODO: Support more than two cameras
                    if (conf.frontFacing) {
                        video.classList.add('FrontFacing');
                        mediaSettings.videoDeviceId = devices[1].id;
                    }
                    else {
                        video.classList.remove('FrontFacing');
                        mediaSettings.videoDeviceId = devices[0].id;
                    }
                    mediaCapture.initializeAsync(mediaSettings).done(function () {
                        video.src = URL.createObjectURL(mediaCapture);
                        video.play();
                    });
                }
                else {
                }
            });
        }
        CameraManager.initialize = initialize;
        function takePhoto() {
            //TODO
        }
        CameraManager.takePhoto = takePhoto;
    })(CameraManager = swiftsnapper.CameraManager || (swiftsnapper.CameraManager = {}));
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
    })(Application = swiftsnapper.Application || (swiftsnapper.Application = {}));
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
            if ($('#CameraPreview').hasClass('FrontFacing')) {
                CameraManager.initialize({
                    'frontFacing': false
                });
            }
            else {
                CameraManager.initialize({
                    'frontFacing': true
                });
            }
        });
        $('#ShutterBtn').on('click tap', function () {
            CameraManager.takePhoto();
        });
        if (Windows.Foundation.Metadata['ApiInformation'].isTypePresent('Windows.Phone.UI.Input.HardwareButtons')) {
            Windows['Phone'].UI.Input.HardwareButtons.addEventListener('camerapressed', function (e) {
                $('#ShutterBtn').click();
            });
        }
    };
})(swiftsnapper || (swiftsnapper = {}));
//# sourceMappingURL=app.js.map