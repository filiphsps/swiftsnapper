var SnapchatAgent = (function () {
    function SnapchatAgent() {
        this.USER_AGENT = 'Snapchat/9.21.0.1 (iPhone8,1; iOS 9.0.2; gzip)';
        this.BASE_ENDPOINT = 'https://app.snapchat.com';
        this.EVENTS_ENDPOINT = 'https://sc-analytics.appspot.com/post_events';
        this.ANALYTICS_ENDPOINT = 'https://sc-analytics.appspot.com/analytics/b';
        this.HASH_PATTERN = '0001110111101110001111010101111011010001001110011000110001000110';
        this.APP_SECRET = 'iEk21fuwZApXlz93750dmW22pw389dPwOk';
        this.APP_STATIC_TOKEN = 'm198sOkJEn37DjqZ32lpRu76xmw288xSQ9';
        this.BLOB_ENCRYPTION_KEY = 'M02cnQ51Ji97vwT4';
    }
    /*
        Generates a UNIX timestamp
    */
    SnapchatAgent.prototype.GenerateTimeStamp = function () {
        return Math.round((new Date).getTime());
    };
    /*
        Generates req_token
        based on https://github.com/cuonic/SnapchatDevWiki/wiki/Generating-the-req_token
    */
    SnapchatAgent.prototype.GenerateRequestToken = function (token, timestamp) {
        var hash1 = sha256(this.APP_SECRET + token);
        var hash2 = sha256(timestamp.toString() + this.APP_SECRET);
        var res = '';
        for (var n = 0; n < this.HASH_PATTERN.length; n++) {
            if (parseInt(this.HASH_PATTERN.substr(n, 1))) {
                res += hash2[n];
            }
            else {
                res += hash1[n];
            }
        }
        return res;
    };
    /*
        TODO: Get this mess to work
        Currently returns 401 UNAUTHORIZED
    */
    SnapchatAgent.prototype.GetDeviceToken = function () {
        var TS = this.GenerateTimeStamp();
        var http = new XMLHttpRequest(), URI = this.BASE_ENDPOINT + '/loq/device_id';
        http.open('POST', URI, false);
        http.setRequestHeader('User-Agent', this.USER_AGENT);
        http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        http.setRequestHeader('Accept-Language', 'en');
        http.setRequestHeader('Accept-Locale', 'en_US');
        http.setRequestHeader('Accept-Encoding', 'gzip');
        http.setRequestHeader('X-Snapchat-Client-Auth-Token', 'Bearer ');
        http.setRequestHeader('X-Snapchat-Client-Auth', '');
        http.setRequestHeader('Authorization', 'Bearer ');
        http.send({
            'timestamp': TS,
            'req_token': this.GenerateRequestToken(this.APP_STATIC_TOKEN, TS)
        });
        return http.responseText;
    };
    return SnapchatAgent;
})();
/// <reference path="snapchat.agent.ts" />
var Snapchat = (function () {
    function Snapchat() {
        this.SnapchatAgent = new SnapchatAgent();
    }
    return Snapchat;
})();
/// <reference path="SC/snapchat.ts" />
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
            if (Windows !== null && typeof Windows !== 'undefined') {
                //Set the status bar to the correct theme colour
                var theme = {
                    a: 255,
                    r: 255,
                    g: 252,
                    b: 0
                }, v = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
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
            var SC = new Snapchat();
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