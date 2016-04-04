var CameraManager;
(function (CameraManager) {
    var video, mediaStream;
    var Capture = Windows.Media.Capture;
    var DeviceInformation = Windows.Devices.Enumeration.DeviceInformation;
    var DeviceClass = Windows.Devices.Enumeration.DeviceClass;
    var DisplayOrientations = Windows.Graphics.Display.DisplayOrientations;
    var FileProperties = Windows.Storage.FileProperties;
    var Media = Windows.Media;
    var SimpleOrientation = Windows.Devices.Sensors.SimpleOrientation;
    var SimpleOrientationSensor = Windows.Devices.Sensors.SimpleOrientationSensor;
    // Receive notifications about rotation of the device and UI and apply any necessary rotation to the preview stream and UI controls
    var oOrientationSensor = SimpleOrientationSensor.getDefault(), oDisplayInformation = Windows.Graphics.Display['DisplayInformation'].getForCurrentView(), oDeviceOrientation = SimpleOrientation.notRotated, oDisplayOrientation = DisplayOrientations.portrait;
    // Prevent the screen from sleeping while the camera is running
    var oDisplayRequest = new Windows.System.Display.DisplayRequest();
    // For listening to media property changes
    //var oSystemMediaControls = Media.SystemMediaTransportControls.getForCurrentView();
    // MediaCapture and its state variables
    var mediaCapture = null, isInitialized = false, isPreviewing = false, isRecording = false;
    // Information about the camera device
    var externalCamera = false, mirroringPreview = false;
    // Rotation metadata to apply to the preview stream and recorded videos (MF_MT_VIDEO_ROTATION)
    // Reference: http://msdn.microsoft.com/en-us/library/windows/apps/xaml/hh868174.aspx
    var RotationKey = "C380465D-2271-428C-9B83-ECEA3B4A85C1";
    //document.getElementById("ShutterBtn").addEventListener("click", shutterButton_tapped);
    function initialize(conf) {
        video = document.getElementById('CameraPreview');
        var cameraPanelEnumerate = Windows.Devices.Enumeration.Panel.back;
        video.classList.remove('FrontFacing');
        if (conf.frontFacing) {
            cameraPanelEnumerate = Windows.Devices.Enumeration.Panel.front;
            video.classList.add('FrontFacing');
        }
        var Capture = Windows.Media.Capture;
        var mediaSettings = new Capture.MediaCaptureInitializationSettings();
        var rotationValue = Capture.VideoRotation.none;
        //mediaSettings.audioDeviceId = "";
        //mediaSettings.videoDeviceId = "";
        //mediaSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.video;;
        //mediaSettings.photoCaptureSource = Capture.PhotoCaptureSource.photo;
        // Get available devices for capturing pictures
        findCameraDeviceByPanelAsync(cameraPanelEnumerate)
            .then(function (camera) {
            if (camera === null) {
                console.log("No camera device found!");
                return;
            }
            // Figure out where the camera is located
            if (!camera.enclosureLocation || camera.enclosureLocation.panel === Windows.Devices.Enumeration.Panel.unknown) {
                // No information on the location of the camera, assume it's an external camera, not integrated on the device
                externalCamera = true;
                oDisplayOrientation = DisplayOrientations.landscape;
            }
            else {
                // Camera is fixed on the device
                externalCamera = false;
                // Only mirror the preview if the camera is on the front panel
                mirroringPreview = (camera.enclosureLocation.panel === Windows.Devices.Enumeration.Panel.front);
            }
            mediaCapture = new Capture.MediaCapture();
            mediaSettings.videoDeviceId = camera.id;
            mediaSettings.streamingCaptureMode = Capture.StreamingCaptureMode.video;
            // Initialize media capture and start the preview
            isInitialized = false;
            mediaCapture.initializeAsync(mediaSettings).then(function () {
                // Prevent the device from sleeping while the preview is running
                oDisplayRequest.requestActive();
                if (mirroringPreview) {
                    video.style.transform = "scale(-1, 1)";
                }
                else {
                    video.style.transform = "scale(1, 1)";
                }
                var previewUrl = URL.createObjectURL(mediaCapture);
                video.src = previewUrl;
                video.play();
                video.addEventListener("playing", function () {
                    isPreviewing = true;
                    // Doing a catch loop because often the mediaCapture.setEncodingPropertiesAsync function was still in progress.
                    // I don't know any better way to do this maybe a singleton design pattern?
                    // TODO: get input on this.
                    try {
                        setPreviewRotationAsync();
                    }
                    catch (Error) {
                        console.log(Error.message);
                        console.log("Error in setPreviewRotationAsync");
                    }
                    /*
                    setPreviewRotationAsync().then(function () {
                        console.log("setPreviewRotationAsync completed correctly");
                    }, function () {
                        console.log("Error in setPreviewEotationAsync");
                    })
                    */
                });
            }, function (error) {
                console.log("Error in mediaCapture.initializeAsync");
            });
        }, function (error) {
            console.log(error.message);
        });
    }
    CameraManager.initialize = initialize;
    function getExportSettings() {
        var pngProperties = new Windows.Media.MediaProperties.ImageEncodingProperties();
        pngProperties = Windows.Media.MediaProperties.ImageEncodingProperties.createPng();
        return pngProperties;
    }
    CameraManager.getExportSettings = getExportSettings;
    function shutterButton_tapped() {
        takePhotoAsync();
    }
    /// <summary>
    /// Takes a photo to a StorageFile and adds rotation metadata to it
    /// </summary>
    /// <returns></returns>
    function takePhotoAsync() {
        if (mediaCapture != null) {
            var Streams = Windows.Storage.Streams;
            var Imaging = Windows.Graphics.Imaging;
            var inputStream = new Streams.InMemoryRandomAccessStream();
            var bitmapDecoder = null, bitmapEncoder = null, outputStream = null;
            // Take the picture
            console.log("Taking photo...");
            mediaCapture.capturePhotoToStreamAsync(Windows.Media.MediaProperties.ImageEncodingProperties.createJpeg(), inputStream);
            console.log("Photo taken!");
            var photoOrientation = convertOrientationToPhotoOrientation(getCameraOrientation());
            return inputStream;
        }
        return null;
    }
    CameraManager.takePhotoAsync = takePhotoAsync;
    /// <summary>
    /// Calculates the current camera orientation from the device orientation by taking into account whether the camera is external or facing the user
    /// </summary>
    /// <returns>The camera orientation in space, with an inverted rotation in the case the camera is mounted on the device and is facing the user</returns>
    function getCameraOrientation() {
        if (externalCamera) {
            // Cameras that are not attached to the device do not rotate along with it, so apply no rotation
            return SimpleOrientation.notRotated;
        }
        var result = oDeviceOrientation;
        // Account for the fact that, on portrait-first devices, the camera sensor is mounted at a 90 degree offset to the native orientation
        if (oDisplayInformation.nativeOrientation === DisplayOrientations.portrait) {
            switch (result) {
                case SimpleOrientation.rotated90DegreesCounterclockwise:
                    result = SimpleOrientation.notRotated;
                    break;
                case SimpleOrientation.rotated180DegreesCounterclockwise:
                    result = SimpleOrientation.rotated90DegreesCounterclockwise;
                    break;
                case SimpleOrientation.rotated270DegreesCounterclockwise:
                    result = SimpleOrientation.rotated180DegreesCounterclockwise;
                    break;
                case SimpleOrientation.notRotated:
                default:
                    result = SimpleOrientation.rotated270DegreesCounterclockwise;
                    break;
            }
        }
        // If the preview is being mirrored for a front-facing camera, then the rotation should be inverted
        if (mirroringPreview) {
            // This only affects the 90 and 270 degree cases, because rotating 0 and 180 degrees is the same clockwise and counter-clockwise
            switch (result) {
                case SimpleOrientation.rotated90DegreesCounterclockwise:
                    return SimpleOrientation.rotated270DegreesCounterclockwise;
                case SimpleOrientation.rotated270DegreesCounterclockwise:
                    return SimpleOrientation.rotated90DegreesCounterclockwise;
            }
        }
        return result;
    }
    /// <summary>
    /// Applies the given orientation to a photo stream and saves it as a StorageFile
    /// </summary>
    /// <param name="stream">The photo stream</param>
    /// <param name="photoOrientation">The orientation metadata to apply to the photo</param>
    /// <returns></returns>
    function reencodeAndSavePhotoAsync(inputStream, orientation) {
        var Imaging = Windows.Graphics.Imaging;
        var bitmapDecoder = null, bitmapEncoder = null, outputStream = null;
        return Imaging.BitmapDecoder.createAsync(inputStream)
            .then(function (decoder) {
            bitmapDecoder = decoder;
            return Windows.Storage.KnownFolders.picturesLibrary.createFileAsync("SimplePhoto.jpg", Windows.Storage.CreationCollisionOption.generateUniqueName);
        }).then(function (file) {
            return file.openAsync(Windows.Storage.FileAccessMode.readWrite);
        }).then(function (outStream) {
            outputStream = outStream;
            return Imaging.BitmapEncoder.createForTranscodingAsync(outputStream, bitmapDecoder);
        }).then(function (encoder) {
            bitmapEncoder = encoder;
            var properties = new Imaging.BitmapPropertySet();
            properties.insert("System.Photo.Orientation", new Imaging.BitmapTypedValue(orientation, Windows.Foundation.PropertyType.uInt16));
            return bitmapEncoder.bitmapProperties.setPropertiesAsync(properties);
        }).then(function () {
            return bitmapEncoder.flushAsync();
        }).then(function () {
            inputStream.close();
            outputStream.close();
        });
    }
    /// <summary>
    /// Attempts to find and return a device mounted on the panel specified, and on failure to find one it will return the first device listed
    /// </summary>
    /// <param name="panel">The desired panel on which the returned device should be mounted, if available</param>
    /// <returns></returns>
    function findCameraDeviceByPanelAsync(panel) {
        var deviceInfo = null;
        // Get available devices for capturing pictures
        return DeviceInformation.findAllAsync(DeviceClass.videoCapture)
            .then(function (devices) {
            devices.forEach(function (cameraDeviceInfo) {
                if (cameraDeviceInfo.enclosureLocation != null && cameraDeviceInfo.enclosureLocation.panel === panel) {
                    deviceInfo = cameraDeviceInfo;
                    return;
                }
            });
            // Nothing matched, just return the first
            if (!deviceInfo && devices.length > 0) {
                deviceInfo = devices.getAt(0);
            }
            return deviceInfo;
        });
    }
    /// <summary>
    /// Converts the given orientation of the app on the screen to the corresponding rotation in degrees
    /// </summary>
    /// <param name="orientation">The orientation of the app on the screen</param>
    /// <returns>An orientation in degrees</returns>
    function convertDisplayOrientationToDegrees(orientation) {
        switch (orientation) {
            case DisplayOrientations.portrait:
                return 90;
            case DisplayOrientations.landscapeFlipped:
                return 180;
            case DisplayOrientations.portraitFlipped:
                return 270;
            case DisplayOrientations.landscape:
            default:
                return 0;
        }
    }
    /// <summary>
    /// Gets the current orientation of the UI in relation to the device (when AutoRotationPreferences cannot be honored) and applies a corrective rotation to the preview
    /// </summary>
    /// <returns></returns>
    function setPreviewRotationAsync() {
        //Edge case for Windows on PCs
        if (!(navigator.userAgent.indexOf('Phone') > -1)) {
            return;
        }
        // Calculate which way and how far to rotate the preview
        var rotationDegrees = convertDisplayOrientationToDegrees(oDisplayOrientation);
        // The rotation direction needs to be inverted if the preview is being mirrored
        if (mirroringPreview) {
            rotationDegrees = (360 - rotationDegrees) % 360;
        }
        // Add rotation metadata to the preview stream to make sure the aspect ratio / dimensions match when rendering and getting preview frames
        var props = mediaCapture.videoDeviceController.getMediaStreamProperties(Capture.MediaStreamType.videoPreview);
        props.properties.insert(RotationKey, rotationDegrees);
        return mediaCapture.setEncodingPropertiesAsync(Capture.MediaStreamType.videoPreview, props, null);
    }
    /// <summary>
    /// Converts the given orientation of the device in space to the metadata that can be added to captured photos
    /// </summary>
    /// <param name="orientation">The orientation of the device in space</param>
    /// <returns></returns>
    function convertOrientationToPhotoOrientation(orientation) {
        switch (orientation) {
            case SimpleOrientation.rotated90DegreesCounterclockwise:
                return FileProperties.PhotoOrientation.rotate90;
            case SimpleOrientation.rotated180DegreesCounterclockwise:
                return FileProperties.PhotoOrientation.rotate180;
            case SimpleOrientation.rotated270DegreesCounterclockwise:
                return FileProperties.PhotoOrientation.rotate270;
            case SimpleOrientation.notRotated:
            default:
                return FileProperties.PhotoOrientation.normal;
        }
    }
})(CameraManager || (CameraManager = {}));
var sha256 = new Hashes.SHA256;
var Snapchat;
(function (Snapchat) {
    var Agent = (function () {
        function Agent() {
            this.SNAPCHAT_BASE_ENDPOINT = null;
            this.SNAPCHAT_EVENTS_ENDPOINT = 'https://sc-analytics.appspot.com/post_events';
            this.SNAPCHAT_ANALYTICS_ENDPOINT = 'https://sc-analytics.appspot.com/analytics/b';
            this.SNAPCHAT_HASH_PATTERN = '0001110111101110001111010101111011010001001110011000110001000110';
            this.SNAPCHAT_API_SECRET = 'iEk21fuwZApXlz93750dmW22pw389dPwOk';
            this.SNAPCHAT_API_STATIC_TOKEN = 'm198sOkJEn37DjqZ32lpRu76xmw288xSQ9';
            this.SNAPCHAT_CLIENT_AUTH_TOKEN = null; //TODO
            this.SNAPCHAT_CLIENT_TOKEN = null; //TODO
            this.SNAPCHAT_AUTH_TOKEN = null;
            this.SNAPCHAT_UUID = null; //TODO
            this.SNAPCHAT_USER_AGENT = null;
            this.SNAPCHAT_VERSION = '9.18.2.0';
            this.CASPER_USER_AGENT = 'SwiftSnapper/1.0.0.0 (SwiftSnapper; Windows 10; gzip)';
            this.CASPER_ENDPOINT = 'https://casper-api.herokuapp.com';
            this.CASPER_API_TOKEN = '';
            this.CASPER_API_SECRET = '';
        }
        Agent.prototype.Initialize = function (cur) {
            var _this = this;
            this.CURRENT_USER_REFERENCE = cur;
            this.CASPER_API_TOKEN = SwiftSnapper.Settings.Get('ApiToken');
            this.CASPER_API_SECRET = SwiftSnapper.Settings.Get('ApiSecret');
            this.SNAPCHAT_BASE_ENDPOINT = SwiftSnapper.Settings.Get('ApiEndpoint');
            return new Promise(function (resolve, reject) {
                _this.InitializeCasper().then(function () {
                    resolve(this);
                }).catch(function (err) {
                    reject(err);
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
            Generates a JWT token
        */
        Agent.prototype.GenerateJwtToken = function (timestamp, parameteters) {
            var header = {
                alg: 'HS256'
            };
            if (!parameteters)
                parameteters = {};
            parameteters['iat'] = timestamp;
            var payload = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(parameteters));
            var signature = sha256.b64_hmac('secretkey', payload).slice(0, -1).replace(/\+/g, '-').replace(/\//g, '_');
            var jwt = payload + '.' + signature;
            return jwt;
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
            var REQ = Windows.Web['Http'].HttpStringContent(this.ParametersToURI(parameters), Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'), HTTP = new Windows.Web['Http'].HttpClient(), HEAD = HTTP.defaultRequestHeaders;
            HEAD = Snapchat.Http.ConfigureHeaders(HEAD, headers);
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
            return new Promise(function (resolve, reject) {
                resolve();
            });
        };
        /*
            Post request to Casper.io's API
        */
        Agent.prototype.PostCasper = function (URI, parameters, headers) {
            if (!headers) {
                headers = {};
            }
            if (!parameters) {
                parameters = {};
            }
            if (URI == null || parameters == null)
                return null;
            URI = new Windows.Foundation.Uri(this.CASPER_ENDPOINT + URI);
            var REQ = Windows.Web['Http'].HttpStringContent(this.ParametersToURI(parameters), Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'), HTTP = new Windows.Web['Http'].HttpClient(), HEAD = HTTP.defaultRequestHeaders;
            HEAD = Snapchat.Http.ConfigureHeaders(HEAD, headers);
            HEAD.append('X-Casper-API-Key', this.CASPER_API_TOKEN);
            return new Promise(function (resolve, reject) {
                var promise = HTTP.postAsync(URI, REQ).done(function (res) {
                    res.content.readAsStringAsync().done(function (res) {
                        resolve(JSON.parse(res));
                    });
                    //Handle reject
                });
            });
        };
        Agent.prototype.GetSnapchatAuthFromCasper = function (endpoint, timestamp) {
            var _this = this;
            var self = this;
            return new Promise(function (resolve, reject) {
                var headers = {
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'gzip',
                    'User-Agent': _this.CASPER_USER_AGENT
                };
                _this.PostCasper('/snapchat/ios/login', {
                    'jwt': _this.GenerateJwtToken(timestamp, {
                        'username': '',
                        'password': ''
                    }),
                }, headers).then(function (res) {
                    console.log(res);
                    if (res.code !== 200)
                        return reject(res.message);
                    //Set data
                    resolve(_this);
                });
            });
        };
        /*
            Converts parameters to URI
        */
        Agent.prototype.ParametersToURI = function (parameters) {
            var res = '';
            for (var index in parameters) {
                if (parameters.hasOwnProperty(index)) {
                    var parameter = parameters[index];
                    if (res != '') {
                        res += '&';
                    }
                    res += index + '=' + parameter;
                }
            }
            return res;
        };
        return Agent;
    })();
    Snapchat.Agent = Agent;
    var Http;
    (function (Http) {
        function ConfigureHeaders(HEAD, headers) {
            for (var index in headers) {
                if (headers.hasOwnProperty(index)) {
                    var header = headers[index];
                    if (index === 'Accept-Encoding') {
                        HEAD.acceptEncoding.clear();
                        HEAD.acceptEncoding.parseAdd(header);
                    }
                    if (index === 'Accept')
                        HEAD.accept.parseAdd(headers.Accept);
                    if (index === 'Accept-Language')
                        HEAD.acceptLanguage.parseAdd(header);
                    if (index === 'Accept-Locale')
                        HEAD.append('Accept-Locale', header);
                    if (index === 'Connection')
                        HEAD.connection.parseAdd(header);
                    if (index === 'Cache-Control')
                        HEAD.cacheControl.parseAdd(header);
                    if (index === 'User-Agent')
                        HEAD.userAgent.parseAdd(header);
                    else
                        HEAD.append(index, headers[index]);
                }
            }
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
            return new Promise(function (resolve, reject) {
                _this.SnapchatAgent.Initialize(_this.CurrentUser).then(function () {
                    resolve(_this);
                }).catch(function (err) {
                    reject(err);
                });
            });
        };
        /*
            Get the current user's pending Snapchat feed
        */
        Client.prototype.GetPendingFeed = function () {
            var Snaps = [];
            if (this.AllUpdatesData != undefined) {
                var friends = this.AllUpdatesData.conversations_response;
                for (var x = 0; x < friends.length; x++) {
                    var snaps = friends[x].pending_received_snaps;
                    for (var n = 0; n < snaps.length; n++) {
                        var snap = snaps[n], sn = new Snapchat.Snap();
                        sn.conversationId = friends[x].id;
                        sn.id = snap.id;
                        sn.mediaType = snap.m;
                        sn.sender = snap.sn;
                        sn.recipient = snap.rp;
                        sn.mediaState = snap.st;
                        //sn.timeSent = snap.sts;
                        sn.timer = snap.timer;
                        sn.timestamp = snap.ts;
                        Snaps.push(sn);
                    }
                }
                Snaps.sort(function (a, b) {
                    return a.timestamp - b.timestamp;
                });
                Snaps.reverse();
                return Snaps;
            }
            else {
                return Snaps;
            }
        };
        /*
            Get the media for the provided snap
        */
        Client.prototype.GetSnapMedia = function (snap) {
            var self = this, data = this.AllUpdatesData, timestamp = this.SnapchatAgent.GenerateTimeStamp();
            return new Promise(function (resolve) {
                self.SnapchatAgent.GetSnapchatAuthFromCasper('/ph/blob', timestamp).then(function (d) {
                    var cData = JSON.parse(d);
                    for (var n = 0; n < cData.endpoints.length; n++)
                        if (cData.endpoints[n].endpoint == '/ph/blob') {
                            cData = cData.endpoints[n];
                            break;
                        }
                    var headers = {
                        'Accept': '*/*',
                        'Accept-Language': 'en',
                        'Accept-Locale': 'en_US',
                        'User-Agent': cData.headers['User-Agent'],
                        'Connection': 'Keep-Alive',
                        'Accept-Encoding': 'gzip',
                        'X-Snapchat-Client-Auth-Token': cData.headers['X-Snapchat-Client-Auth-Token'],
                        'X-Snapchat-UUID': cData.headers['X-Snapchat-UUID'],
                    };
                    self.SnapchatAgent.PostSnapchat('/ph/blob', [
                        ['id', snap.id],
                        ['req_token', cData.params['req_token']],
                        ['timestamp', cData.params['timestamp']],
                        ['username', self.CurrentUser.username]
                    ], headers).then(function (data) {
                        resolve(data);
                    });
                });
            });
        };
        /*
            Get a user's SnapTag
            Doesn't work yet.
        */
        Client.prototype.GetSnapTag = function (username) {
            var self = this, data = this.AllUpdatesData, timestamp = this.SnapchatAgent.GenerateTimeStamp(), req_token = this.SnapchatAgent.GenerateRequestToken(this.SnapchatAgent.SNAPCHAT_AUTH_TOKEN, timestamp);
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
                    ['user_id', sha256.hex(username.toLowerCase())],
                    ['type', 'SVG'],
                    ['req_token', req_token],
                    ['timestamp', timestamp],
                    ['username', username]
                ], headers).then(function (data) {
                    resolve(data);
                });
            });
        };
        Client.prototype.PostSnap = function (URI, parameters, headers) {
            return this.SnapchatAgent.PostSnapchat(URI, parameters, headers);
        };
        /*
            Register a new user
        */
        Client.prototype.Register = function (details) {
            //TODO when Casper/Snapchat API become available 
        };
        /*
            Log In a user
        */
        Client.prototype.Login = function (details) {
            return new Promise(function (resolve, reject) {
                reject('TODO');
            });
        };
        return Client;
    })();
    Snapchat.Client = Client;
})(Snapchat || (Snapchat = {}));
var messageManager;
(function (messageManager) {
    var popup;
    function initialize() {
        popup = Windows.UI.Popups;
    }
    messageManager.initialize = initialize;
    function alert(message, title, callback) {
        var alert = new popup.MessageDialog(message, title);
        alert.commands.append(new popup.UICommand("OK", function (cmd) {
            if (callback !== null)
                callback();
        }));
        alert.defaultCommandIndex = 1;
        alert.showAsync();
    }
    messageManager.alert = alert;
    function alertWithOptions(message, title, commands, index, callback) {
        var alert = new popup.MessageDialog(message, title), cb = function (cmd) {
            callback(cmd.label);
        };
        for (var n = void 0; n < commands.length; n++) {
            alert.commands.append(new popup.UICommand(commands[n], cb));
        }
        alert.defaultCommandIndex = index;
        alert.showAsync();
    }
    messageManager.alertWithOptions = alertWithOptions;
})(messageManager || (messageManager = {}));
var SwiftSnapper;
(function (SwiftSnapper) {
    var WindowManager;
    (function (WindowManager) {
        var view = null, pi = null, theme = {
            a: 255,
            r: 52,
            g: 152,
            b: 219
        };
        function initialize() {
            view = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
            view.titleBar.inactiveBackgroundColor = theme;
            view.titleBar.buttonInactiveBackgroundColor = theme;
            view.titleBar.backgroundColor = theme;
            view.titleBar.buttonBackgroundColor = theme;
            view['setDesiredBoundsMode'](Windows.UI.ViewManagement['ApplicationViewBoundsMode'].useCoreWindow);
            view['setPreferredMinSize']({
                height: 1024,
                width: 325
            });
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined') {
                $('body').addClass('mobile'); //TODO: Move to initialize()
                var statusBar = Windows.UI.ViewManagement['StatusBar'].getForCurrentView();
                statusBar.showAsync();
                statusBar.backgroundOpacity = 0;
                statusBar.backgroundColor = Windows.UI.ColorHelper.fromArgb(255, 52, 152, 219);
                statusBar.foregroundColor = Windows.UI.Colors.white;
                //Lock portrait
                Windows.Graphics.Display['DisplayInformation'].autoRotationPreferences = Windows.Graphics.Display.DisplayOrientations.portrait;
            }
        }
        WindowManager.initialize = initialize;
        function showStatusBar() {
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined') {
                var statusBar = Windows.UI.ViewManagement['StatusBar'].getForCurrentView();
                statusBar.showAsync();
            }
        }
        WindowManager.showStatusBar = showStatusBar;
        function hideStatusBar() {
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined') {
                var statusBar = Windows.UI.ViewManagement['StatusBar'].getForCurrentView();
                statusBar.hideAsync();
            }
        }
        WindowManager.hideStatusBar = hideStatusBar;
        function startLoading(message) {
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined') {
                pi = Windows.UI.ViewManagement['StatusBar'].getForCurrentView().progressIndicator;
                pi.text = message;
                pi.progressValue = null;
                pi.showAsync();
            }
        }
        WindowManager.startLoading = startLoading;
        function stopLoading() {
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined' && pi !== null) {
                pi.hideAsync();
            }
        }
        WindowManager.stopLoading = stopLoading;
    })(WindowManager = SwiftSnapper.WindowManager || (SwiftSnapper.WindowManager = {}));
})(SwiftSnapper || (SwiftSnapper = {}));
/// <reference path="typings/cordova/plugins/Device.d.ts" />
/// <reference path="typings/winrt/winrt.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="SC/snapchat.ts" />
/// <reference path="cameraManager.ts" />
/// <reference path="messageManager.ts" />
/// <reference path="windowManager.ts" />
var views;
var SwiftSnapper;
(function (SwiftSnapper) {
    "use strict";
    var SnapchatClient;
    var language = Windows.System.UserProfile.GlobalizationPreferences.languages[0];
    var currentItem = null, SystemNavigator = null;
    var Application;
    (function (Application) {
        function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);
            messageManager.initialize();
            SwiftSnapper.WindowManager.initialize();
            if (!SwiftSnapper.Settings.Get('ApiEndpoint'))
                SwiftSnapper.Settings.Set('ApiEndpoint', 'https://app.snapchat.com');
        }
        Application.initialize = initialize;
        function getLanguageStrings(lang, callback) {
            $.getJSON('lang/' + lang + '.json', function (lang) {
                callback(lang);
            }, function (e) {
                //Error
                $.getJSON('lang/en-US.json', function (lang) {
                    callback(lang);
                });
            }).fail(function () {
                $.getJSON('lang/en-US.json', function (lang) {
                    callback(lang);
                });
            });
        }
        Application.getLanguageStrings = getLanguageStrings;
        function onDeviceReady() {
            // Handle the Cordova pause and resume events
            document.addEventListener('pause', onPause, false);
            document.addEventListener('resume', onResume, false);
            SystemNavigator = Windows.UI.Core['SystemNavigationManager'].getForCurrentView();
            SystemNavigator.addEventListener("backrequested", toCenterView);
        }
        function onPause() {
            // TODO: This application has been suspended. Save application state here.
        }
        function onResume() {
        }
    })(Application = SwiftSnapper.Application || (SwiftSnapper.Application = {}));
    window.onload = function () {
        Application.initialize();
        var connectionProfile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();
        if (connectionProfile != null && connectionProfile.getNetworkConnectivityLevel() == Windows.Networking.Connectivity.NetworkConnectivityLevel.internetAccess) {
            SnapchatClient = new Snapchat.Client();
            SnapchatClient.Initialize().then(function () {
                $(document).ready(function () {
                    $('body').load('views/account/index.html');
                });
            }).catch(function (err) {
                messageManager.alert('Error: ' + err, 'Error!', null);
                $(document).ready(function () {
                    $('body').load('views/account/index.html');
                });
            });
        }
        else {
            messageManager.alert("Please press OK and connect to the internet", "No internet connection", function () {
                window.close();
            });
        }
    };
    function onAccountView() {
        Application.getLanguageStrings(language, function (lang) {
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
                mouseDrag: false,
                touchDrag: false,
                pullDrag: false,
                fallbackEasing: 'easeInOutQuart',
                items: 1,
            });
            views.on('initialized.owl.carousel changed.owl.carousel', function (event) {
                currentItem = event.item.index;
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
                e.preventDefault();
                var credential = new Windows.Security.Credentials.PasswordCredential("SwiftSnapper", $('#LogInView form .username').val(), $('#LogInView form .password').val());
                logIn(credential, lang);
            });
            $(function () {
                var vault = new Windows.Security.Credentials.PasswordVault();
                var credentialList = vault.retrieveAll();
                if (credentialList.length > 0) {
                    var credential = vault.retrieve("SwiftSnapper", credentialList[0].userName);
                    logIn(credential, lang);
                }
            });
        });
        function logIn(credential, lang) {
            SwiftSnapper.WindowManager.startLoading(lang.views.account.logInView.loggingIn);
            $('#LogInView form .username').prop("disabled", true);
            $('#LogInView form .password').prop("disabled", true);
            SnapchatClient.Login({
                username: credential.userName,
                password: credential.password,
            }).then(function (data) {
                var vault = new Windows.Security.Credentials.PasswordVault();
                if (typeof data['status'] !== 'undefined' && data['status'] !== 200) {
                    if (vault.retrieveAll().length > 0) {
                        vault.remove(credential);
                    }
                    messageManager.alert(lang.views.account.logInView.wrongUsernameOrPassword, lang.views.account.logInView.failedToLogIn, null);
                    SwiftSnapper.WindowManager.stopLoading();
                    $('#LogInView form .username').prop("disabled", false);
                    $('#LogInView form .password').prop("disabled", false);
                    return -1;
                }
                if (vault.retrieveAll().length == 0) {
                    vault.add(credential);
                }
                SwiftSnapper.WindowManager.stopLoading();
                SwiftSnapper.WindowManager.hideStatusBar();
                $('body').load('views/overview/index.html');
            }).catch(function (err) {
                SwiftSnapper.WindowManager.stopLoading();
                SwiftSnapper.WindowManager.hideStatusBar();
                $('body').load('views/overview/index.html');
            });
        }
    }
    SwiftSnapper.onAccountView = onAccountView;
    function toCenterView(eventArgs) {
        SystemNavigator.AppViewBackButtonVisibility = Windows.UI.Core['AppViewBackButtonVisibility'].collapsed;
        console.log(currentItem);
        if (currentItem != 1) {
            views.trigger('to.owl.carousel', [1, 300, true]);
            eventArgs.handled = true;
        }
        ;
    }
    function onOverviewView() {
        Application.getLanguageStrings(language, function (lang) {
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
            views.on('initialized.owl.carousel changed.owl.carousel', function (event) {
                var pos = event.item.index;
                currentItem = pos;
                if (pos == 1) {
                    SwiftSnapper.WindowManager.hideStatusBar();
                }
                else
                    SwiftSnapper.WindowManager.showStatusBar();
            });
            CameraManager.initialize({
                'frontFacing': false
            });
            var snaps;
            try {
                snaps = SnapchatClient.GetPendingFeed();
                for (var n = 0; n < snaps.length; n++) {
                    var snap = snaps[n], output = '<article class="item" id="' + n + '"><div class="notify snap"><span class="icon mdl2-checkbox-fill"></span></div><div class="details">' +
                        '<div class="header">' + snap.sender + '</div>' +
                        '<div class="details">Length: ' + snap.timer.toString() + '</div>' +
                        '</div></article>';
                    $('#SnapsView .SnapsList').append(output);
                }
                if (snaps.length < 1)
                    throw ('no snaps');
            }
            catch (e) {
                $('#SnapsView .SnapsList').append('<p class="note">' + lang.views.overview.emptyFeed + '</p>');
            }
            //Temp for showing snaps
            $('#SnapsView .SnapsList article').on('click tap', function (e) {
                var snap = snaps[$(e.currentTarget).attr('id')];
                SnapchatClient.GetSnapMedia(snap).then(function (img) {
                    $('#ShowSnapView').css('display', 'block');
                    $('#ShowSnapView img').attr('src', 'data:image/jpeg;base64,' + btoa(img));
                });
            });
            $('#ShowSnapView').on('click tap', function () {
                $('#ShowSnapView').css('display', 'none');
            });
            $('#ViewSnapsBtn').on('click tap', function () {
                views.trigger('prev.owl.carousel', [300]);
            });
            $('#ViewStoriesBtn').on('click tap', function () {
                views.trigger('next.owl.carousel', [300]);
            });
            $('#CameraToggleBtn').on('click tap', function () {
                $('#CameraPreview').toggleClass('FrontFacing');
                if ($('#CameraPreview').hasClass('FrontFacing')) {
                    CameraManager.initialize({
                        frontFacing: true
                    });
                }
                else {
                    CameraManager.initialize({
                        frontFacing: false
                    });
                }
            });
            $('#ShutterBtn').on('click tap', function () {
                var IStream = CameraManager.takePhotoAsync();
                console.log("Picture Taken");
                if (IStream != null) {
                    messageManager.alert("Picture Taken!", "Success", null);
                }
                else {
                    messageManager.alert("No Camera!\nSilly Goose!", "Failure", null);
                }
            });
            $('#SettingsBtn').on('click tap', function () {
                $('body').load('views/settings/index.html');
            });
            if (typeof Windows !== 'undefined' && Windows.Foundation.Metadata['ApiInformation'].isTypePresent('Windows.Phone.UI.Input.HardwareButtons')) {
                Windows['Phone'].UI.Input.HardwareButtons.addEventListener('camerapressed', function (e) {
                    $('#ShutterBtn').click();
                });
            }
        });
    }
    SwiftSnapper.onOverviewView = onOverviewView;
    function onSettingsView() {
        Application.getLanguageStrings(language, function (lang) {
            var template = Handlebars.compile($("#template").html());
            $('#PageContent').html(template(lang));
            $('#LogoutBtn').on('click tap', function () {
                messageManager.alert("Cleared all credentials!", "Cleared Credentials", null);
                var vault = new Windows.Security.Credentials.PasswordVault();
                var creds = vault.retrieveAll();
                for (var i = 0; i < creds.length; ++i) {
                    vault.remove(creds[i]);
                }
                $('body').load('views/account/index.html');
            });
            $('#BackBtn').on('click tap', function () {
                $('body').load('views/overview/index.html');
            });
            //Handle API Token
            var ApiToken = SwiftSnapper.Settings.Get('ApiToken');
            if (ApiToken)
                $('#TextBoxApiToken').val(ApiToken);
            $('#TextBoxApiToken').on('change', function (e) {
                SwiftSnapper.Settings.Set('ApiToken', $('#TextBoxApiToken').val());
            });
            //Handle API Secret
            var ApiSecret = SwiftSnapper.Settings.Get('ApiSecret');
            if (ApiSecret)
                $('#TextBoxApiSecret').val(ApiSecret);
            $('#TextBoxApiSecret').on('change', function (e) {
                SwiftSnapper.Settings.Set('ApiSecret', $('#TextBoxApiSecret').val());
            });
            //Handle API Endpoint
            var ApiEndpoint = SwiftSnapper.Settings.Get('ApiEndpoint');
            if (ApiEndpoint)
                $('#TextBoxApiEndpoint').val(ApiEndpoint);
            $('#TextBoxApiEndpoint').on('change', function (e) {
                SwiftSnapper.Settings.Set('ApiEndpoint', $('#TextBoxApiEndpoint').val());
            });
        });
    }
    SwiftSnapper.onSettingsView = onSettingsView;
})(SwiftSnapper || (SwiftSnapper = {}));
var SwiftSnapper;
(function (SwiftSnapper) {
    var Settings;
    (function (Settings) {
        function Get(item) {
            return localStorage.getItem('_s_' + item);
        }
        Settings.Get = Get;
        function Set(item, data) {
            localStorage.setItem('_s_' + item, data);
        }
        Settings.Set = Set;
    })(Settings = SwiftSnapper.Settings || (SwiftSnapper.Settings = {}));
})(SwiftSnapper || (SwiftSnapper = {}));
//# sourceMappingURL=app.js.map