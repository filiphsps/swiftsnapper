var SwiftSnapper;
(function (SwiftSnapper) {
    var Backend = (function () {
        function Backend() {
            Http.Initialize();
        }
        Backend.prototype.Get = function (options) {
            return new Promise(function (resolve, reject) {
                Http.Get(options).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            });
        };
        Backend.prototype.Post = function (options) {
            return new Promise(function (resolve, reject) {
                Http.Post(options).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            });
        };
        Backend.prototype.Put = function (options) {
            return new Promise(function (resolve, reject) {
                Http.Put(options).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            });
        };
        Backend.prototype.Delete = function (options) {
            return new Promise(function (resolve, reject) {
                Http.Delete(options).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            });
        };
        return Backend;
    }());
    SwiftSnapper.Backend = Backend;
    var Http;
    (function (Http) {
        var SWIFTSNAPPER_URI = 'https://swiftsnapper.playstr.link/v1/', SWIFTSNAPPER_USERAGENT = null;
        function Initialize() {
            var device = 'device', os = 'os', appVersion = 'x.x.x.x';
            SWIFTSNAPPER_USERAGENT = 'SwiftSnapper/' + appVersion + ' (' + device + ', ' + os + '; gzip)';
            $.ajaxSetup({
                beforeSend: function (xhr) {
                    if (localStorage.getItem('Authorization') !== null)
                        xhr.setRequestHeader("Authorization", "Basic " + localStorage.getItem('Authorization'));
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                }
            });
        }
        Http.Initialize = Initialize;
        function Get(options) {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: SWIFTSNAPPER_URI + options.endpoint,
                    type: 'GET',
                    success: function (res) {
                        resolve(res);
                    },
                    error: function (err) {
                        reject(err);
                    }
                });
            });
        }
        Http.Get = Get;
        function Post(options) {
            return new Promise(function (resolve, reject) {
                $.post(SWIFTSNAPPER_URI + options.endpoint, options.data, function (res) {
                    resolve(res);
                }, 'json').fail(function (jqXHR, err) {
                    reject(err);
                });
            });
        }
        Http.Post = Post;
        function Put(options) {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: options.endpoint,
                    type: 'PUT',
                    contentType: "application/json",
                    data: options.data,
                    success: function (res) {
                        resolve(res);
                    },
                    error: function (err) {
                        reject(err);
                    }
                });
            });
        }
        Http.Put = Put;
        function Delete(options) {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: options.endpoint,
                    type: 'DELETE',
                    contentType: "application/json",
                    data: options.data,
                    success: function (res) {
                        resolve(res);
                    },
                    error: function (err) {
                        reject(err);
                    }
                });
            });
        }
        Http.Delete = Delete;
    })(Http || (Http = {}));
})(SwiftSnapper || (SwiftSnapper = {}));
var SwiftSnapper;
(function (SwiftSnapper) {
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
    })(CameraManager = SwiftSnapper.CameraManager || (SwiftSnapper.CameraManager = {}));
})(SwiftSnapper || (SwiftSnapper = {}));
'use strict';
var views;
var SwiftSnapper;
(function (SwiftSnapper) {
    SwiftSnapper.language = Windows.System.UserProfile.GlobalizationPreferences.languages[0] || 'en-US';
    SwiftSnapper.currentItem = null, SwiftSnapper.SystemNavigator = null;
    var Application;
    (function (Application) {
        function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);
            SwiftSnapper.MessageManager.initialize();
            SwiftSnapper.WindowManager.initialize();
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
            //Handle the Cordova pause and resume events
            document.addEventListener('pause', onPause, false);
            document.addEventListener('resume', onResume, false);
            SwiftSnapper.SystemNavigator = Windows.UI.Core['SystemNavigationManager'].getForCurrentView();
            SwiftSnapper.SystemNavigator.addEventListener('backrequested', toCenterView);
        }
        function onPause() {
            //TODO: This application has been suspended. Save application state here.
        }
        function onResume() {
            //TODO: Resume
        }
    })(Application = SwiftSnapper.Application || (SwiftSnapper.Application = {}));
    window.onload = function () {
        Application.initialize();
        var connectionProfile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();
        if (connectionProfile != null && connectionProfile.getNetworkConnectivityLevel() == Windows.Networking.Connectivity.NetworkConnectivityLevel.internetAccess) {
            $('body').load('views/account/index.html');
        }
        else {
            SwiftSnapper.MessageManager.alert('Please connect to the internet and start the app again', 'No internet connection', function () {
                window.close();
            });
        }
    };
    function onAccountView() {
        Application.getLanguageStrings(SwiftSnapper.language, function (lang) {
            var template = Handlebars.compile($('#template').html());
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
                SwiftSnapper.currentItem = event.item.index;
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
                var credential = new Windows.Security.Credentials.PasswordCredential('SwiftSnapper', $('#LogInView form .username').val(), $('#LogInView form .password').val());
                logIn(credential, lang);
            });
            $(function () {
                var vault = new Windows.Security.Credentials.PasswordVault();
                var credentialList = vault.retrieveAll();
                if (credentialList.length > 0) {
                    var credential = vault.retrieve('SwiftSnapper', credentialList[0].userName);
                    logIn(credential, lang);
                }
            });
        });
        function logIn(credential, lang) {
            SwiftSnapper.WindowManager.startLoading(lang.views.account.logInView.loggingIn);
            $('#LogInView form .username').prop('disabled', true);
            $('#LogInView form .password').prop('disabled', true);
            //TODO: Actually login
            var vault = new Windows.Security.Credentials.PasswordVault();
            if (vault.retrieveAll().length == 0) {
                vault.add(credential);
            }
            localStorage.setItem('Authorization', btoa(credential.userName + ":" + credential.password));
            localStorage.setItem('AuthToken', null);
            SwiftSnapper.WindowManager.stopLoading();
            SwiftSnapper.WindowManager.hideStatusBar();
            $('body').load('views/overview/index.html');
        }
    }
    SwiftSnapper.onAccountView = onAccountView;
    function onOverviewView() {
        Application.getLanguageStrings(SwiftSnapper.language, function (lang) {
            var template = Handlebars.compile($('#template').html());
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
                SwiftSnapper.currentItem = pos;
                if (pos == 1) {
                    SwiftSnapper.WindowManager.hideStatusBar();
                }
                else
                    SwiftSnapper.WindowManager.showStatusBar();
            });
            SwiftSnapper.CameraManager.initialize({
                'frontFacing': false
            });
            var cn = new SwiftSnapper.Backend(), snaps;
            cn.Get({
                endpoint: 'snaps'
            }).then(function (res) {
                snaps = res.data;
                localStorage.setItem('AuthToken', res.authToken);
                if (!snaps || snaps.length < 1)
                    return $('#SnapsView .SnapsList').append('<p class="note">' + lang.views.overview.emptyFeed + '</p>');
                for (var n = 0; n < snaps.length; n++) {
                    var snap = snaps[n], output = '<article class="item" data-id="' + snap.id + '"><div class="notify snap"><span class=";icon mdl2-checkbox-fill"></span></div><div class="details">' +
                        '<div class="header">' + snap.sender + '</div>' +
                        '<div class="details">Length: ' + snap.timer.toString() + '</div>' +
                        '</div></article>';
                    $('#SnapsView .SnapsList').append(output);
                }
            }).catch(function (err) {
                SwiftSnapper.MessageManager.alert('Error: ' + err, 'Error!', null);
                $('#SnapsView .SnapsList').append('<p class="note">' + lang.views.overview.emptyFeed + '</p>');
            });
            //Temp for showing snaps
            $('body').on('click tap', '#SnapsView .SnapsList .item', function (e) {
                var snap = $(e.currentTarget).data('id');
                cn.Get({
                    endpoint: 'snaps/' + snap + '/' + localStorage.getItem('AuthToken')
                }).then(function (res) {
                    $('#ShowSnapView').css('display', 'block');
                    $('#ShowSnapView img').attr('src', 'data:image/*;base64,' + btoa(res));
                }).catch(function (err) {
                    console.log(err);
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
                    SwiftSnapper.CameraManager.initialize({
                        frontFacing: true
                    });
                }
                else {
                    SwiftSnapper.CameraManager.initialize({
                        frontFacing: false
                    });
                }
            });
            $('#ShutterBtn').on('click tap', function () {
                var IStream = SwiftSnapper.CameraManager.takePhotoAsync();
                console.log('Picture Taken');
                if (IStream != null) {
                    SwiftSnapper.MessageManager.alert('Picture Taken!', 'Success', null);
                }
                else {
                    SwiftSnapper.MessageManager.alert('No Camera!', 'Failure', null);
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
    function toCenterView(eventArgs) {
        SwiftSnapper.SystemNavigator.AppViewBackButtonVisibility = Windows.UI.Core['AppViewBackButtonVisibility'].collapsed;
        if (SwiftSnapper.currentItem != 1) {
            views.trigger('to.owl.carousel', [1, 300, true]);
            eventArgs.handled = true;
        }
    }
})(SwiftSnapper || (SwiftSnapper = {}));
var SwiftSnapper;
(function (SwiftSnapper) {
    var MessageManager;
    (function (MessageManager) {
        var popup;
        function initialize() {
            popup = Windows.UI.Popups;
        }
        MessageManager.initialize = initialize;
        function alert(message, title, callback) {
            var alert = new popup.MessageDialog(message, title);
            alert.commands.append(new popup.UICommand("OK", function (cmd) {
                if (callback)
                    callback();
            }));
            alert.defaultCommandIndex = 1;
            alert.showAsync();
        }
        MessageManager.alert = alert;
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
        MessageManager.alertWithOptions = alertWithOptions;
    })(MessageManager = SwiftSnapper.MessageManager || (SwiftSnapper.MessageManager = {}));
})(SwiftSnapper || (SwiftSnapper = {}));
var SwiftSnapper;
(function (SwiftSnapper) {
    var Views;
    (function (Views) {
        var Overview;
        (function (Overview) {
            function OnView() {
                SwiftSnapper.Application.getLanguageStrings(SwiftSnapper.language, function (lang) {
                    var template = Handlebars.compile($('#template').html());
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
                        SwiftSnapper.currentItem = pos;
                        if (pos == 1) {
                            SwiftSnapper.WindowManager.hideStatusBar();
                        }
                        else
                            SwiftSnapper.WindowManager.showStatusBar();
                    });
                    SwiftSnapper.CameraManager.initialize({
                        'frontFacing': false
                    });
                    var cn = new SwiftSnapper.Backend(), snaps;
                    cn.Get({
                        endpoint: 'snaps'
                    }).then(function (res) {
                        snaps = res.data;
                        localStorage.setItem('AuthToken', res.authToken);
                        if (!snaps || snaps.length < 1)
                            return $('#SnapsView .SnapsList').append('<p class="note">' + lang.views.overview.emptyFeed + '</p>');
                        for (var n = 0; n < snaps.length; n++) {
                            var snap = snaps[n], output = '<article class="item" data-id="' + snap.id + '"><div class="notify snap"><span class=";icon mdl2-checkbox-fill"></span></div><div class="details">' +
                                '<div class="header">' + snap.sender + '</div>' +
                                '<div class="details">Length: ' + snap.timer.toString() + '</div>' +
                                '</div></article>';
                            $('#SnapsView .SnapsList').append(output);
                        }
                    }).catch(function (err) {
                        SwiftSnapper.MessageManager.alert('Error: ' + err, 'Error!', null);
                        $('#SnapsView .SnapsList').append('<p class="note">' + lang.views.overview.emptyFeed + '</p>');
                    });
                    //Temp for showing snaps
                    $('body').on('click tap', '#SnapsView .SnapsList .item', function (e) {
                        var snap = $(e.currentTarget).data('id');
                        cn.Get({
                            endpoint: 'snaps/' + snap + '/' + localStorage.getItem('AuthToken')
                        }).then(function (res) {
                            $('#ShowSnapView').css('display', 'block');
                            $('#ShowSnapView img').attr('src', 'data:image/*;base64,' + btoa(res));
                        }).catch(function (err) {
                            console.log(err);
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
                            SwiftSnapper.CameraManager.initialize({
                                frontFacing: true
                            });
                        }
                        else {
                            SwiftSnapper.CameraManager.initialize({
                                frontFacing: false
                            });
                        }
                    });
                    $('#ShutterBtn').on('click tap', function () {
                        var IStream = SwiftSnapper.CameraManager.takePhotoAsync();
                        console.log('Picture Taken');
                        if (IStream != null) {
                            SwiftSnapper.MessageManager.alert('Picture Taken!', 'Success', null);
                        }
                        else {
                            SwiftSnapper.MessageManager.alert('No Camera!', 'Failure', null);
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
            Overview.OnView = OnView;
        })(Overview = Views.Overview || (Views.Overview = {}));
    })(Views = SwiftSnapper.Views || (SwiftSnapper.Views = {}));
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
var SwiftSnapper;
(function (SwiftSnapper) {
    var Views;
    (function (Views) {
        var Settings;
        (function (Settings) {
            function OnView() {
                SwiftSnapper.Application.getLanguageStrings(SwiftSnapper.language, function (lang) {
                    var template = Handlebars.compile($('#template').html());
                    $('#PageContent').html(template(lang));
                    $('#LogoutBtn').on('click tap', function () {
                        SwiftSnapper.MessageManager.alert('Cleared all credentials!', 'Cleared Credentials', null);
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
                });
            }
            Settings.OnView = OnView;
        })(Settings = Views.Settings || (Views.Settings = {}));
    })(Views = SwiftSnapper.Views || (SwiftSnapper.Views = {}));
})(SwiftSnapper || (SwiftSnapper = {}));
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
