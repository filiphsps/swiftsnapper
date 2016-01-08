var sha256 = new Hashes.SHA256;
var Snapchat;
(function (Snapchat) {
    var SnapchatAgent = (function () {
        function SnapchatAgent() {
            this.SNAPCHAT_IOS_USER_AGENT = 'Snapchat/{sc_ver} (iPhone5,1; iOS 8.4; gzip)';
            this.SNAPCHAT_ANDROID_USER_AGENT = 'Snapchat/{sc_ver} (SM-G900F; Android 6.0.1#a5175b00e7#23; gzip)';
            this.SNAPCHAT_BASE_ENDPOINT = 'https://app.snapchat.com';
            this.SNAPCHAT_EVENTS_ENDPOINT = 'https://sc-analytics.appspot.com/post_events';
            this.SNAPCHAT_ANALYTICS_ENDPOINT = 'https://sc-analytics.appspot.com/analytics/b';
            this.SNAPCHAT_HASH_PATTERN = '0001110111101110001111010101111011010001001110011000110001000110';
            this.SNAPCHAT_API_SECRET = 'iEk21fuwZApXlz93750dmW22pw389dPwOk';
            this.SNAPCHAT_API_STATIC_TOKEN = 'm198sOkJEn37DjqZ32lpRu76xmw288xSQ9';
            this.SNAPCHAT_VERSION = null;
            this.CASPER_USER_AGENT = 'Casper/1.5.2.3 (SM-G900F; Android 6.0.1#a5175b00e7#23; gzip; SwiftSnapper)';
            this.CASPER_ENDPOINT = 'https://api.casper.io';
            this.CASPER_API_KEY = '740c1d60b292fc8a44cdc9a3301e124a';
            this.CASPER_API_TOKEN = 'TODO: Figure this one out';
            this.CASPER_API_SECRET = 'fuckinginsecuresecretkey'; //API secret taken from io.casper.android.n.a.a
            this.CASPER_SIGNATURE = 'v1:3d603604ff4a56d8a6821e9edfd8bb1257af436faf88c1a9bbb9dcefe8a56849';
            this.CASPER_VERSION = '1.5.2.3';
            this.CASPER_DEVICE_ID = null;
            if (!this.InitializeCasper())
                console.log('Initialization of Casper failed!'); //TODO: Show error dialog through custom message class
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
            var hash1 = sha256.hex(this.SNAPCHAT_API_SECRET + token);
            var hash2 = sha256.hex(timestamp.toString() + this.SNAPCHAT_API_SECRET);
            var res = '';
            for (var n = 0; n < this.SNAPCHAT_HASH_PATTERN.length; n++) {
                if (parseInt(this.SNAPCHAT_HASH_PATTERN.substr(n, 1))) {
                    res += hash2[n];
                }
                else {
                    res += hash1[n];
                }
            }
            return res;
        };
        /*
            Casper Related functions.
            TODO: move to snapchat.casper.agent.ts
            ==================================================
        */
        /*
            Initialize Casper for use
        */
        SnapchatAgent.prototype.InitializeCasper = function () {
            this.CASPER_DEVICE_ID = this.GenerateCasperDeviceId();
            var timestamp = this.GenerateTimeStamp();
            console.log(this.GenerateRequestToken(this.SNAPCHAT_API_STATIC_TOKEN, 1440465889080));
            //TODO: Request config values from "/config"
            var self = this;
            var configCallback = function (config) {
                if (config.code !== 200)
                    console.log('Failed to fetch Casper config!'); //TODO: Show error dialog through custom message class
                var sc_ver = self.SNAPCHAT_VERSION;
                self.SNAPCHAT_VERSION = config.configuration.snapchat.login.snapchat_version;
                self.SNAPCHAT_IOS_USER_AGENT = self.SNAPCHAT_IOS_USER_AGENT.replace('{sc_ver}', self.SNAPCHAT_VERSION);
                self.SNAPCHAT_ANDROID_USER_AGENT = self.SNAPCHAT_IOS_USER_AGENT.replace('{sc_ver}', self.SNAPCHAT_VERSION);
                console.log(config);
            };
            this.PostCasper(configCallback, '/config', [
                ['casper_version', this.CASPER_VERSION],
                ['device_id', this.CASPER_DEVICE_ID],
                ['snapchat_version', this.SNAPCHAT_VERSION],
                ['timestamp', timestamp.toString()],
                ['token', this.CASPER_API_TOKEN],
                ['token_hash', this.GenerateCasperTokenHash()]
            ], {
                'Connection': 'Keep-Alive',
                'AcceptEncoding': 'gzip'
            });
            //TODO: Make async?
            return 1;
        };
        /*
            Post request to Casper.io's API
        */
        SnapchatAgent.prototype.PostCasper = function (callback, URI, parameters, headers) {
            if (headers == null) {
                headers = {};
            }
            if (URI == null || parameters == null)
                return -1;
            URI = new Windows.Foundation.Uri(this.CASPER_ENDPOINT + URI);
            var REQ = Windows.Web['Http'].HttpStringContent(this.ArrayToURIParameters(parameters), Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'), HTTP = new Windows.Web['Http'].HttpClient(), HEAD = HTTP.defaultRequestHeaders;
            //TODO: Custom headers?
            if (typeof headers.AcceptEncoding !== 'undefined') {
                HEAD.acceptEncoding.clear();
                HEAD.acceptEncoding.parseAdd(headers.AcceptEncoding);
            }
            if (typeof headers.Connection !== 'undefined')
                HEAD.connection.parseAdd(headers.Connection);
            if (typeof headers.CacheControl !== 'undefined')
                HEAD.cacheControl.parseAdd(headers.CacheControl);
            else
                HEAD.cacheControl.clear();
            HEAD.userAgent.parseAdd(this.CASPER_USER_AGENT);
            //HEAD.connection.parseAdd('Keep-Alive');
            HEAD.append('X-Casper-API-Key', this.CASPER_API_KEY);
            HEAD.append('X-Casper-Signature', this.GenerateCasperRequestSignature(parameters));
            var promise = HTTP.postAsync(URI, REQ).done(function (res) {
                res.content.readAsStringAsync().done(function (e) {
                    callback(JSON.parse(e));
                });
            });
        };
        /*
            Generates Signature to be used with Casper's API
            P.S Casper expects the parameters to be in alphabetical order.
        */
        SnapchatAgent.prototype.GenerateCasperRequestSignature = function (parameters) {
            var req = '';
            parameters = parameters.sort(function (a, b) {
                return a[0].localeCompare(b[0]);
            });
            for (var n = 0; n < parameters.length; n++) {
                req += parameters[n][0] + parameters[n][1];
            }
            return 'v1:' + sha256.hex_hmac(this.CASPER_API_SECRET, req);
        };
        /*
            Generates Token hash to be used with Casper's API
        */
        SnapchatAgent.prototype.GenerateCasperTokenHash = function () {
            //TODO
            return 'todo';
        };
        //TODO: Investigate how Android's device id is generated
        SnapchatAgent.prototype.GenerateCasperDeviceId = function () {
            var id = '';
            var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i <= 16; i++)
                id += charset.charAt(Math.floor(Math.random() * charset.length));
            return id;
        };
        /*
            Converts an Array of Arrys to uri parameters
            Ex. input [['para1', 'val1'], ['para2', 'val2'], ['para3', 'val3']].
        */
        SnapchatAgent.prototype.ArrayToURIParameters = function (data) {
            data = data.sort(function (a, b) {
                return a[0] > b[0] ? 1 : -1;
            });
            var res = '';
            for (var n = 0; n < data.length; n++) {
                if (res != '') {
                    res += '&';
                    res += data[n][0] + '=' + data[n][1];
                }
            }
            return res;
        };
        return SnapchatAgent;
    })();
    Snapchat.SnapchatAgent = SnapchatAgent;
})(Snapchat || (Snapchat = {}));
var Snapchat;
(function (Snapchat) {
    var User = (function () {
        function User() {
        }
        return User;
    })();
    Snapchat.User = User;
})(Snapchat || (Snapchat = {}));
/// <reference path="snapchat.agent.ts" />
/// <reference path="snapchat.models.ts" />
var Snapchat;
(function (Snapchat) {
    var Client = (function () {
        function Client() {
            this.SnapchatAgent = new Snapchat.SnapchatAgent();
        }
        Client.prototype.Login = function (data) {
            /*const timestamp = this.SnapchatAgent.GenerateTimeStamp(),
                req =
                    'casper_version=' + this.SnapchatAgent.CASPER_VERSION +
                    '&google_email=' + data.gmail.user +
                    '&google_password_encrypted=' + 'TODO' +
                    '&snapchat_version=' + this.SnapchatAgent.SNAPCHAT_VERSION +
                    '&snapchat_user_agent' + encodeURI(this.SnapchatAgent.SNAPCHAT_ANDROID_USER_AGENT) +
                    '&username' + data.snapchat.user +
                    '&password' + data.snapchat.pass +
                    '&timestamp' + timestamp;

            let URI = new Windows.Foundation.Uri(this.SnapchatAgent.CASPER_ENDPOINT + '/snapchat/auth'),
                REQ = Windows.Web['Http'].HttpStringContent(req, Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'),
                HTTP = new Windows.Web['Http'].HttpClient(),
                HEADERS = HTTP.defaultRequestHeaders;

            HEADERS.userAgent.parseAdd(this.SnapchatAgent.CASPER_USER_AGENT);
            HEADERS.connection.parseAdd('Keep-Alive');
            HEADERS.acceptEncoding.parseAdd('gzip');
            HEADERS.append('X-Casper-API-Key', this.SnapchatAgent.CASPER_API_TOKEN);
            HEADERS.append('X-Casper-Signature', this.SnapchatAgent.CASPER_SIGNATURE);

            let httpPromise = HTTP.postAsync(URI, REQ).then(function (res) {
                console.log(res);
            });*/
        };
        return Client;
    })();
    Snapchat.Client = Client;
})(Snapchat || (Snapchat = {}));
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
            var SC = new Snapchat.Client();
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
        if (typeof Windows !== 'undefined' && Windows.Foundation.Metadata['ApiInformation'].isTypePresent('Windows.Phone.UI.Input.HardwareButtons')) {
            Windows['Phone'].UI.Input.HardwareButtons.addEventListener('camerapressed', function (e) {
                $('#ShutterBtn').click();
            });
        }
    };
})(swiftsnapper || (swiftsnapper = {}));
//# sourceMappingURL=app.js.map