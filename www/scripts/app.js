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
var SnapchatAgent = (function () {
    function SnapchatAgent() {
        this.API_STATIC_TOKEN = 'm198sOkJEn37DjqZ32lpRu76xmw288xSQ9';
        this.API_SECRET = 'iEk21fuwZApXlz93750dmW22pw389dPwOk';
        this.USER_AGENT = 'Snapchat/9.16.2.0 (HTC One; Android 5.0.2#482424.2#21; gzip)';
        this.ENDPOINT = 'https://feelinsonice-hrd.appspot.com';
        this.HASH_PATTERN = '0001110111101110001111010101111011010001001110011000110001000110';
        this.BLOB_ENCRYPTION_KEY = 'M02cnQ51Ji97vwT4';
    }
    SnapchatAgent.prototype.GenerateTimeStamp = function () {
        return Math.round((new Date).getTime());
    };
    SnapchatAgent.prototype.DecryptCBC = function (data, key, iv) {
    };
    SnapchatAgent.prototype.DecryptECB = function (data) {
    };
    SnapchatAgent.prototype.EncryptECB = function (data) {
    };
    SnapchatAgent.prototype.Hash = function (d1, d2) {
        d1 = this.API_SECRET + d1;
        d2 = d2 + this.API_SECRET;
        //TODO: Find a good PHP-like Cryptography library.
        /*var hash = new sha256();
        hash.update(hash, d1);
        var value1 = sha256.final();

        hash = new sha256();
        hash.update(hash, d2);
        var value2: string = hash.final();

        var res = '';
        for (var n = 0; n < this.HASH_PATTERN.length; n++) {
            res += this.HASH_PATTERN.substr(n, 1) ? value1.charAt(n) : value2.charAt(n);
        }
        return res*/
    };
    return SnapchatAgent;
})();
/*
    Typescript implementation of https://github.com/mgp25/SC-API
*/
/// <reference path="snapchat.agent.ts" />
var Snapchat = (function () {
    function Snapchat() {
    }
    return Snapchat;
})();
//# sourceMappingURL=app.js.map