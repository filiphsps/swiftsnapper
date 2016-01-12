/// <reference path="typings/winrt/winrt.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="SC/snapchat.ts" />
/// <reference path="cameraManager.ts" />
/// <reference path="messageManager.ts" />
/// <reference path="windowManager.ts" />

declare var Handlebars: any;
let views;

module swiftsnapper {
    "use strict";

    let SnapchatClient: Snapchat.Client;
    let language = Windows.System.UserProfile.GlobalizationPreferences.languages[0];



    export module Application {
        export function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);
            messageManager.initialize();
            windowManager.initialize();
        }

        export function getLanguageStrings(lang: string, callback: Function) {
            $.get('lang/' + lang + '.json').done(function () {
                $.getJSON('lang/' + lang + '.json', function (lang) {
                    callback(lang);
                }, function (e) {
                    //Error
                    $.getJSON('lang/en-US.json', function (lang) {
                        callback(lang);
                    });
                });
            }).fail(function () {
                $.getJSON('lang/en-US.json', function (lang) {
                    callback(lang);
                });
            });;
        }

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
    }

    window.onload = function () {
        Application.initialize();

        //Init Snapchat
        SnapchatClient = new Snapchat.Client();
        SnapchatClient.Initialize().then(function () {
            $(document).ready(function () {
                $('body').load('views/account/index.html');
            });
        });
    }

    export function onAccountView() {
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
                windowManager.startLoading('Logging In...');
                $('#LogInView form .username').prop("disabled", true);
                $('#LogInView form .password').prop("disabled", true);

                SnapchatClient.Login({
                    username: $('#LogInView form .username').val(),
                    password: $('#LogInView form .password').val(),
                }).then(
                    function (data) {
                        if (typeof data['status'] !== 'undefined' && data['status'] !== 200) {

                            messageManager.alert('Wrong username or password!', 'Failed to login', null); //TODO: Lang

                            $('#LogInView form .username').prop("disabled", false);
                            $('#LogInView form .password').prop("disabled", false);
                            return -1;
                        }

                        windowManager.stopLoading();
                        $(document).ready(function () {
                            $('body').load('views/overview/index.html');
                        });

                        e.preventDefault();
                });
            });
        });
    }

    export function onOverviewView() {
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

            //temp: view unread snaps
            var snaps = SnapchatClient.GetPendingFeed()
            for (var n = 0; n < snaps.length; n++) {
                let snap = snaps[n],
                    output =
                        '<article class="item"><div class="notify snap"><span class="icon mdl2-checkbox-fill"></span></div><div class="details">' +
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
                } else {
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
        });
    }
}
