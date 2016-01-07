/// <reference path="typings/winrt/winrt.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
var views
declare var Handlebars: any;

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

            Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture)
                .done(function (devices) {
                    if (devices.length > 0) {
                        if (conf.frontFacing) {
                            video.classList.add('FrontFacing');

                            mediaSettings.videoDeviceId = devices[1].id;
                        } else {
                            video.classList.remove('FrontFacing');

                            mediaSettings.videoDeviceId = devices[0].id;
                        }

                        mediaCapture.initializeAsync(mediaSettings).done(function () {
                            video.src = URL.createObjectURL(mediaCapture);
                            video.play();
                        });
                    } else {
                        //No camera found
                    }
                });
        }

        export function takePhoto() {
            //TODO
        }
    }

    export module Application {
        export function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);

            if (typeof Windows !== 'undefined') {
                //Set the status bar to the correct theme colour
                var theme = {
                    a: 255,
                    r: 255,
                    g: 252,
                    b: 0
                },

                v = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
                v.titleBar.inactiveBackgroundColor = theme;
                v.titleBar.buttonInactiveBackgroundColor = theme;
                v.titleBar.backgroundColor = theme;
                v.titleBar.buttonBackgroundColor = theme;
                v.titleBar.inactiveForegroundColor = Windows.UI.Colors.white;
                v.titleBar['inactiveButtonForegroundColor'] = Windows.UI.Colors.white;
                v.titleBar.buttonForegroundColor = Windows.UI.Colors.white;
                v.titleBar.foregroundColor = Windows.UI.Colors.white;
                v['setDesiredBoundsMode'](Windows.UI.ViewManagement['ApplicationViewBoundsMode'].useCoreWindow);
            }
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
        //TODO: Provide data from file
        var lang = {
            app: {
                name: 'SwiftSnapper'
            },
            snaps: {
                double_tap_to_reply: 'Double tap to reply',
                day_ago: 'day ago',
                days_ago: 'days ago',
                just_now: 'just now',
            },
            stories: {
                title: 'Stories',
                discover: 'Discover',
            }
        };
        var template = Handlebars.compile($("#template").html());
        $('#PageContent').html(template(lang));
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
            } else {
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
    }
}
