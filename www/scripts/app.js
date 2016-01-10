var sha256 = new Hashes.SHA256;
var Snapchat;
(function (Snapchat) {
    var Agent = (function () {
        function Agent() {
            this.SNAPCHAT_BASE_ENDPOINT = 'https://app.snapchat.com';
            this.SNAPCHAT_EVENTS_ENDPOINT = 'https://sc-analytics.appspot.com/post_events';
            this.SNAPCHAT_ANALYTICS_ENDPOINT = 'https://sc-analytics.appspot.com/analytics/b';
            this.SNAPCHAT_HASH_PATTERN = '0001110111101110001111010101111011010001001110011000110001000110';
            this.SNAPCHAT_API_SECRET = 'iEk21fuwZApXlz93750dmW22pw389dPwOk';
            this.SNAPCHAT_API_STATIC_TOKEN = 'm198sOkJEn37DjqZ32lpRu76xmw288xSQ9';
            this.SNAPCHAT_CLIENT_AUTH_TOKEN = null;
            this.SNAPCHAT_CLIENT_TOKEN = null;
            this.SNAPCHAT_UUID = null;
            this.SNAPCHAT_USER_AGENT = null;
            this.SNAPCHAT_VERSION = '9.18.2.0';
            this.CASPER_USER_AGENT = 'Casper/1.5.2.3 (SwiftSnapper; Windows 10; gzip)';
            this.CASPER_ENDPOINT = 'https://api.casper.io';
            this.CASPER_HASH_PATTERN = '0100011111110000101111101001101011110010100110011101110010101000';
            this.CASPER_API_KEY = '740c1d60b292fc8a44cdc9a3301e124a';
            this.CASPER_API_TOKEN = '9UpsYwhthWspIoHonKjniOMu09UBkS9w';
            this.CASPER_API_SECRET = 'fuckinginsecuresecretkey'; //API secret taken from io.casper.android.n.a.a
            this.CASPER_SIGNATURE = 'v1:3d603604ff4a56d8a6821e9edfd8bb1257af436faf88c1a9bbb9dcefe8a56849';
            this.CASPER_VERSION = '1.5.2.3';
            this.CASPER_DEVICE_ID = null;
        }
        Agent.prototype.Initialize = function () {
            var _this = this;
            return new Promise(function (resolve) {
                _this.InitializeCasper().then(function () {
                    resolve(this);
                });
            });
        };
        /*
            Generates a UNIX timestamp
        */
        Agent.prototype.GenerateTimeStamp = function () {
            return Math.round((new Date).getTime());
        };
        /*
            Generates req_token
            based on https://github.com/cuonic/SnapchatDevWiki/wiki/Generating-the-req_token
        */
        Agent.prototype.GenerateRequestToken = function (token, timestamp) {
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
            Post request to Snapchat's API
        */
        Agent.prototype.PostSnapchat = function (URI, parameters, headers) {
            if (headers == null) {
                headers = {};
            }
            if (URI == null || parameters == null)
                return null;
            URI = new Windows.Foundation.Uri(this.SNAPCHAT_BASE_ENDPOINT + URI);
            var REQ = Windows.Web['Http'].HttpStringContent(this.ArrayToURIParameters(parameters), Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'), HTTP = new Windows.Web['Http'].HttpClient(), HEAD = HTTP.defaultRequestHeaders;
            HEAD = Snapchat.Http.ConfigureHeaders(HEAD, headers);
            HEAD.append('X-Snapchat-Client-Auth-Token', this.SNAPCHAT_CLIENT_AUTH_TOKEN);
            HEAD.append('X-Snapchat-UUID', this.SNAPCHAT_UUID);
            return new Promise(function (resolve) {
                var promise = HTTP.postAsync(URI, REQ).done(function (res) {
                    res.content.readAsStringAsync().done(function (e) {
                        resolve(e);
                    });
                });
            });
        };
        /*
            Casper Related functions.
            TODO: move to snapchat.casper.agent.ts
            ==================================================
        */
        /*
            Initialize Casper for use
        */
        Agent.prototype.InitializeCasper = function () {
            var _this = this;
            this.CASPER_DEVICE_ID = this.GenerateCasperDeviceId();
            var timestamp = this.GenerateTimeStamp();
            var self = this;
            return new Promise(function (resolve) {
                var headers = {
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'gzip',
                    'User-Agent': _this.CASPER_USER_AGENT,
                };
                _this.PostCasper('/config', [
                    ['casper_version', _this.CASPER_VERSION],
                    ['device_id', _this.CASPER_DEVICE_ID],
                    ['timestamp', timestamp.toString()],
                    ['token', _this.CASPER_API_TOKEN],
                    ['token_hash', _this.GenerateCasperTokenHash(timestamp)]
                ], headers).then(function (conf) {
                    var config = JSON.parse(conf);
                    if (config.code !== 200)
                        console.log('Failed to fetch Casper config!'); //TODO: Show error dialog through custom message class
                    var sc_ver = self.SNAPCHAT_VERSION;
                    self.SNAPCHAT_VERSION = config.configuration.snapchat.login.snapchat_version;
                    resolve(this);
                });
            });
        };
        /*
            Post request to Casper.io's API
        */
        Agent.prototype.PostCasper = function (URI, parameters, headers) {
            if (headers == null) {
                headers = {};
            }
            if (URI == null || parameters == null)
                return null;
            URI = new Windows.Foundation.Uri(this.CASPER_ENDPOINT + URI);
            var REQ = Windows.Web['Http'].HttpStringContent(this.ArrayToURIParameters(parameters), Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'), HTTP = new Windows.Web['Http'].HttpClient(), HEAD = HTTP.defaultRequestHeaders;
            HEAD = Snapchat.Http.ConfigureHeaders(HEAD, headers);
            HEAD.append('X-Casper-API-Key', this.CASPER_API_KEY);
            HEAD.append('X-Casper-Signature', this.GenerateCasperRequestSignature(parameters));
            return new Promise(function (resolve) {
                var promise = HTTP.postAsync(URI, REQ).done(function (res) {
                    res.content.readAsStringAsync().done(function (e) {
                        resolve(e);
                    });
                });
            });
        };
        /*
            Generates Token hash to be used with Casper's API
        */
        Agent.prototype.GenerateCasperTokenHash = function (timestamp) {
            var s1 = sha256.hex(this.CASPER_DEVICE_ID + this.CASPER_API_TOKEN), s2 = sha256.hex(this.CASPER_API_TOKEN + timestamp.toString());
            var res = '';
            for (var n = 0; n < this.CASPER_HASH_PATTERN.length; n++) {
                if (this.CASPER_HASH_PATTERN.charAt(n) === '0') {
                    res += s1[n];
                }
                else {
                    res += s2[n];
                }
            }
            return res;
        };
        /*
            Generates Signature to be used with Casper's API
            P.S Casper expects the parameters to be in alphabetical order.
        */
        Agent.prototype.GenerateCasperRequestSignature = function (parameters) {
            var req = '';
            parameters = parameters.sort(function (a, b) {
                return a[0].localeCompare(b[0]);
            });
            for (var n = 0; n < parameters.length; n++) {
                req += parameters[n][0] + parameters[n][1];
            }
            return 'v1:' + sha256.hex_hmac(this.CASPER_API_SECRET, req);
        };
        //TODO: Investigate how Android's device id is generated
        Agent.prototype.GenerateCasperDeviceId = function () {
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
        Agent.prototype.ArrayToURIParameters = function (data) {
            data = data.sort(function (a, b) {
                return a[0] > b[0] ? 1 : -1;
            });
            var res = '';
            for (var n = 0; n < data.length; n++) {
                if (res != '') {
                    res += '&';
                }
                res += data[n][0] + '=' + data[n][1];
            }
            return res;
        };
        return Agent;
    })();
    Snapchat.Agent = Agent;
    var Http;
    (function (Http) {
        function ConfigureHeaders(HEAD, headers) {
            //TODO: Custom headers?
            if (typeof headers['Accept-Encoding'] !== 'undefined') {
                HEAD.acceptEncoding.clear();
                HEAD.acceptEncoding.parseAdd(headers['Accept-Encoding']);
            }
            if (typeof headers.Accept !== 'undefined')
                HEAD.accept.parseAdd(headers.Accept);
            if (typeof headers['Accept-Language'] !== 'undefined')
                HEAD.acceptLanguage.parseAdd(headers['Accept-Language']);
            if (typeof headers['Accept-Locale'] !== 'undefined')
                HEAD.append('Accept-Locale', headers['Accept-Locale']);
            if (typeof headers.Connection !== 'undefined')
                HEAD.connection.parseAdd(headers.Connection);
            if (typeof headers['Cache-Control'] !== 'undefined')
                HEAD.cacheControl.parseAdd(headers.CacheControl);
            else
                HEAD.cacheControl.clear();
            if (typeof headers['User-Agent'] !== 'undefined')
                HEAD.userAgent.parseAdd(headers['User-Agent']);
            if (typeof headers['X-Snapchat-Client-Token'] !== 'undefined')
                HEAD.append('X-Snapchat-Client-Token', headers['X-Snapchat-Client-Token']);
            return HEAD;
        }
        Http.ConfigureHeaders = ConfigureHeaders;
    })(Http = Snapchat.Http || (Snapchat.Http = {}));
})(Snapchat || (Snapchat = {}));
var Snapchat;
(function (Snapchat) {
    var User = (function () {
        function User() {
        }
        return User;
    })();
    Snapchat.User = User;
    var Snap = (function () {
        function Snap() {
            this.timer = 0;
            this.timestamp = 0;
        }
        return Snap;
    })();
    Snapchat.Snap = Snap;
})(Snapchat || (Snapchat = {}));
/// <reference path="snapchat.agent.ts" />
/// <reference path="snapchat.models.ts" />
var Snapchat;
(function (Snapchat) {
    var Client = (function () {
        function Client() {
        }
        Client.prototype.Initialize = function () {
            var _this = this;
            this.SnapchatAgent = new Snapchat.Agent();
            this.CurrentUser = new Snapchat.User();
            return new Promise(function (resolve) {
                _this.SnapchatAgent.Initialize().then(function () {
                    resolve(this);
                });
            });
        };
        /*
            Get the current user's pending Snapchat feed
        */
        Client.prototype.GetPendingFeed = function () {
            var Snaps = [], friends = this.AllUpdatesData.conversations_response;
            for (var x = 0; x < friends.length; x++) {
                var snaps = friends[x].pending_received_snaps;
                for (var n = 0; n < snaps.length; n++) {
                    var snap = snaps[n], sn = new Snapchat.Snap();
                    sn.sender = snap.sn;
                    sn.timer = snap.timer;
                    sn.timestamp = snap.ts;
                    Snaps.push(sn);
                }
            }
            Snaps.sort(function (a, b) {
                return a.timestamp - b.timestamp;
            });
            return Snaps;
        };
        /*
            Get a user's SnapTag
        */
        Client.prototype.GetSnapTag = function (username) {
            var self = this, data = this.AllUpdatesData, timestamp = this.SnapchatAgent.GenerateTimeStamp();
            return new Promise(function (resolve) {
                var headers = {
                    'Accept': '*/*',
                    'Accept-Language': 'en',
                    'Accept-Locale': 'en_us',
                    'User-Agent': self.SnapchatAgent.SNAPCHAT_USER_AGENT,
                    'Accept-Encoding': 'gzip',
                    'Connection': 'Keep-Alive',
                };
                self.SnapchatAgent.PostSnapchat('/bq/snaptag_download', [
                    ['user_id', sha256.hex(username.toLowerCase())]['type', 'SVG'],
                    ['req_token', self.SnapchatAgent.GenerateRequestToken(self.SnapchatAgent.SNAPCHAT_CLIENT_AUTH_TOKEN, timestamp)],
                    ['timestamp', timestamp.toString()],
                    ['username', username]
                ], headers).then(function (data) {
                    resolve(data);
                });
            });
        };
        /*
            Log In a user
        */
        Client.prototype.Login = function (details) {
            var _this = this;
            return new Promise(function (resolve) {
                if (details.username.length < 1 || details.password.length < 1) {
                    resolve({ 'code': -1, 'message': 'You must provide both username AND password!' });
                    return;
                }
                var headers = {
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'gzip',
                    'User-Agent': _this.SnapchatAgent.CASPER_USER_AGENT,
                };
                var timestamp = _this.SnapchatAgent.GenerateTimeStamp(), self = _this;
                _this.SnapchatAgent.PostCasper('/snapchat/auth', [
                    ['username', details.username],
                    ['password', details.password],
                    ['snapchat_version', _this.SnapchatAgent.SNAPCHAT_VERSION],
                    ['timestamp', timestamp.toString()],
                    ['token', _this.SnapchatAgent.CASPER_API_TOKEN],
                    ['token_hash', _this.SnapchatAgent.GenerateCasperTokenHash(timestamp)]
                ], headers).then(function (snapchatData) {
                    var data = JSON.parse(snapchatData);
                    if (data.code !== 200) {
                        resolve(data); //TODO
                        return;
                    }
                    self.SnapchatAgent.SNAPCHAT_CLIENT_AUTH_TOKEN = data.headers['X-Snapchat-Client-Auth-Token'];
                    self.SnapchatAgent.SNAPCHAT_CLIENT_TOKEN = data.headers['X-Snapchat-Client-Token'];
                    self.SnapchatAgent.SNAPCHAT_UUID = data.headers['X-Snapchat-UUID'];
                    headers = data.headers;
                    headers['X-Snapchat-Client-Token'] = self.SnapchatAgent.SNAPCHAT_CLIENT_TOKEN;
                    self.SnapchatAgent.PostSnapchat('/loq/login', [
                        ['height', data.params.height],
                        ['ny', data.params.nt],
                        ['password', data.params.password],
                        ['remember_device', data.params.remember_device],
                        ['req_token', data.params.req_token],
                        ['screen_height_in', data.params.height_width_px],
                        ['screen_height_px', data.params.height_width_px],
                        ['screen_width_in', data.params.screen_width_in],
                        ['screen_width_px', data.params.screen_width_px],
                        ['timestamp', data.params.timestamp],
                        ['user_ad_id', data.params.user_ad_id],
                        ['username', data.params.username],
                        ['width', data.params.width],
                    ], headers).then(function (data) {
                        self.AllUpdatesData = JSON.parse(data);
                        if (typeof data['status'] !== 'undefined' && data['status'] !== 200) {
                            resolve({ 'code': data['status'], 'message': data['message'] });
                            return;
                        }
                        self.CurrentUser.username = details.username;
                        resolve(JSON.parse(data));
                    });
                });
            });
        };
        return Client;
    })();
    Snapchat.Client = Client;
})(Snapchat || (Snapchat = {}));
/// <reference path="SC/snapchat.ts" />
/// <reference path="typings/winrt/winrt.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
var views;
var swiftsnapper;
(function (swiftsnapper) {
    "use strict";
    var SnapchatClient;
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
        }
        function onPause() {
            // TODO: This application has been suspended. Save application state here.
        }
        function onResume() {
        }
    })(Application = swiftsnapper.Application || (swiftsnapper.Application = {}));
    window.onload = function () {
        Application.initialize();
        //Init Snapchat
        SnapchatClient = new Snapchat.Client();
        SnapchatClient.Initialize().then(function () {
            $(document).ready(function () {
                $('body').load('views/account/index.html');
            });
        });
        if (typeof Windows !== 'undefined') {
            //Set the status bar to the correct theme colour
            var theme = {
                a: 255,
                r: 52,
                g: 152,
                b: 219
            }, v = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
            v.titleBar.inactiveBackgroundColor = theme;
            v.titleBar.buttonInactiveBackgroundColor = theme;
            v.titleBar.backgroundColor = theme;
            v.titleBar.buttonBackgroundColor = theme;
            v['setDesiredBoundsMode'](Windows.UI.ViewManagement['ApplicationViewBoundsMode'].useCoreWindow);
            v['setPreferredMinSize']({
                height: 1024,
                width: 325
            });
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined') {
                $('body').addClass('mobile');
                var statusBar = Windows.UI.ViewManagement['StatusBar'].getForCurrentView();
                statusBar.showAsync();
                statusBar.backgroundOpacity = 1;
                statusBar.backgroundColor = Windows.UI.ColorHelper.fromArgb(255, 52, 152, 219);
                statusBar.foregroundColor = Windows.UI.Colors.white;
            }
        }
    };
    function onAccountView() {
        //Init Owl Carousel
        views = $('#views');
        views.owlCarousel({
            loop: false,
            nav: false,
            dots: false,
            video: true,
            margin: 0,
            startPosition: 1,
            mouseDrag: false,
            touchDrag: false,
            pullDrag: false,
            fallbackEasing: 'easeInOutQuart',
            items: 1,
        });
        $('header').on('click tap', function () {
            views.trigger('to.owl.carousel', [1, 300, true]);
        });
        $('#LogInBtn').on('click tap', function () {
            views.trigger('next.owl.carousel', [300]);
        });
        $('#SignUpBtn').on('click tap', function () {
            views.trigger('prev.owl.carousel', [300]);
        });
        $('#LogInForm').submit(function (e) {
            $('#LogInView form .username').prop("disabled", true);
            $('#LogInView form .password').prop("disabled", true);
            SnapchatClient.Login({
                username: $('#LogInView form .username').val(),
                password: $('#LogInView form .password').val(),
            }).then(function (data) {
                if (typeof data['code'] !== 'undefined' && data['code'] !== 200) {
                    //TODO
                    $('#LogInView form .username').prop("disabled", false);
                    $('#LogInView form .password').prop("disabled", false);
                    return -1;
                }
                $(document).ready(function () {
                    $('body').load('views/overview/index.html');
                });
            });
            e.preventDefault();
        });
    }
    swiftsnapper.onAccountView = onAccountView;
    function onOverviewView() {
        //TODO: use data from
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
        //temp: view unread snaps
        var snaps = SnapchatClient.GetPendingFeed();
        for (var n = 0; n < snaps.length; n++) {
            var snap = snaps[n], output = '<article class="item"><div class="notify snap"><span class="icon mdl2-checkbox-fill"></span></div><div class="details">' +
                '<div class="header">' + snap.sender + '</div>' +
                '<div class="details">Length: ' + snap.timer.toString() + '</div>' +
                '</div></article>';
            $('#SnapsView .SnapsList').append(output);
        }
        CameraManager.initialize({
            'frontFacing': false
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
    }
    swiftsnapper.onOverviewView = onOverviewView;
})(swiftsnapper || (swiftsnapper = {}));
//# sourceMappingURL=app.js.map