'use strict';
/// <reference path='typings/cordova/plugins/Device.d.ts' />
/// <reference path='typings/winrt/winrt.d.ts' />
/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/es6-promise/es6-promise.d.ts' />
/// <reference path='cameraManager.ts' />
/// <reference path='messageManager.ts' />
/// <reference path='windowManager.ts' />

declare let Handlebars: any;
let views;

module SwiftSnapper {
    let currentItem = null,
        SystemNavigator = null;
    const language = Windows.System.UserProfile.GlobalizationPreferences.languages[0];

    export module Application {
        export function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);
            MessageManager.initialize();
            WindowManager.initialize();
        }

        export function getLanguageStrings(lang: string, callback: Function) {
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

        function onDeviceReady() {
            // Handle the Cordova pause and resume events
            document.addEventListener('pause', onPause, false);
            document.addEventListener('resume', onResume, false);
            SystemNavigator = Windows.UI.Core['SystemNavigationManager'].getForCurrentView();
            SystemNavigator.addEventListener('backrequested', toCenterView);
        }

        function onPause() {
            // TODO: This application has been suspended. Save application state here.
        }

        function onResume() {

        }
    }

    window.onload = function () {
        Application.initialize();
        let connectionProfile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();
        if (connectionProfile != null && connectionProfile.getNetworkConnectivityLevel() == Windows.Networking.Connectivity.NetworkConnectivityLevel.internetAccess) {
            $('body').load('views/account/index.html');
        } else {
            MessageManager.alert('Please connect to the internet and start the app again', 'No internet connection', function () {
                window.close();
            });
        }
    };

    export function onAccountView() {
        Application.getLanguageStrings(language, function (lang) {
            let template = Handlebars.compile($('#template').html());
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
                let credential = new Windows.Security.Credentials.PasswordCredential('SwiftSnapper', $('#LogInView form .username').val(), $('#LogInView form .password').val());
                logIn(credential, lang);
            });

            $(function () {
                let vault = new Windows.Security.Credentials.PasswordVault();
                let credentialList = vault.retrieveAll();
                if (credentialList.length > 0) {
                    let credential = vault.retrieve('SwiftSnapper', credentialList[0].userName);
                    logIn(credential, lang);
                }
            });
        });

        function logIn(credential, lang) {
            WindowManager.startLoading(lang.views.account.logInView.loggingIn);
            $('#LogInView form .username').prop('disabled', true);
            $('#LogInView form .password').prop('disabled', true);

            //TODO: Actually login
            let vault = new Windows.Security.Credentials.PasswordVault();
            if (vault.retrieveAll().length == 0) {
                vault.add(credential);
            }

            localStorage.setItem('Authorization', btoa(credential.userName + ":" + credential.password));
            WindowManager.stopLoading();
            WindowManager.hideStatusBar();
            $('body').load('views/overview/index.html');
        }
    }

    export function onOverviewView() {
        Application.getLanguageStrings(language, function (lang) {
            let template = Handlebars.compile($('#template').html());
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
                let pos = event.item.index;
                currentItem = pos;
                if (pos == 1) {
                    WindowManager.hideStatusBar();
                } else
                    WindowManager.showStatusBar();
            });

            CameraManager.initialize({
                'frontFacing': false
            });

            let cn = new SwiftSnapper.Backend(),
                snaps;

            cn.Get({
                endpoint: 'snaps'
            }).then((res: any) => {
                snaps = res.data;

                for (let n = 0; n < snaps.length; n++) {
                    let snap = snaps[n],
                        output =
                            '<article class="item" id=" + n + "><div class="notify snap"><span class=";icon mdl2-checkbox-fill"></span></div><div class="details">' +
                            '<div class="header">' + snap.sender + '</div>' +
                            '<div class="details">Length: ' + snap.timer.toString() + '</div>' +
                            '</div></article>';

                    $('#SnapsView .SnapsList').append(output);
                }

                if (snaps.length < 1)
                    $('#SnapsView .SnapsList').append('<p class="note">' + lang.views.overview.emptyFeed + '</p>');
            }).catch((err) => {
                MessageManager.alert('Error: ' + err, 'Error!', null);
            });

            //Temp for showing snaps
            $('#SnapsView .SnapsList article').on('click tap', (e) => {
                let snap = snaps[$(e.currentTarget).attr('id')];

                console.log(snap);
                cn.Get({
                    endpoint: 'snaps/' + snap
                }).then((res: any) => {
                    $('#ShowSnapView').css('display', 'block');
                    $('#ShowSnapView img').attr('src', 'data:image/jpeg;base64,' + res.data);
                });
            });
            $('#ShowSnapView').on('click tap', () => {
                $('#ShowSnapView').css('display', 'none');
            });

            $('#ViewSnapsBtn').on('click tap', () => {
                views.trigger('prev.owl.carousel', [300]);
            });
            $('#ViewStoriesBtn').on('click tap', () => {
                views.trigger('next.owl.carousel', [300]);
            });

            $('#CameraToggleBtn').on('click tap', () => {
                $('#CameraPreview').toggleClass('FrontFacing');

                if ($('#CameraPreview').hasClass('FrontFacing')) {
                    CameraManager.initialize({
                        frontFacing: true
                    });
                } else {
                    CameraManager.initialize({
                        frontFacing: false
                    });
                  }
                }
            );
            $('#ShutterBtn').on('click tap', () => {
                let IStream = CameraManager.takePhotoAsync();
                console.log('Picture Taken');
                if (IStream != null) {
                    MessageManager.alert('Picture Taken!', 'Success', null);
                    // Send to SnapChat or editor view or something.
                    // SnapchatClient.PostSnap(IStream, [['paraName1', 'Val'], ['paraName2', 'Val']], {});
                }
                else {
                    MessageManager.alert('No Camera!', 'Failure', null);
                }
            });
            $('#SettingsBtn').on('click tap', () => {
                $('body').load('views/settings/index.html');
            });


            if (typeof Windows !== 'undefined' && Windows.Foundation.Metadata['ApiInformation'].isTypePresent('Windows.Phone.UI.Input.HardwareButtons')) {
                Windows['Phone'].UI.Input.HardwareButtons.addEventListener('camerapressed', function (e) {
                    $('#ShutterBtn').click();
                });
            }
        });
    }

    export function onSettingsView() {
        Application.getLanguageStrings(language, function (lang) {
            let template = Handlebars.compile($('#template').html());
            $('#PageContent').html(template(lang));

            $('#LogoutBtn').on('click tap', function () {
                MessageManager.alert('Cleared all credentials!', 'Cleared Credentials', null);
                let vault = new Windows.Security.Credentials.PasswordVault();
                let creds = vault.retrieveAll();
                for (let i = 0; i < creds.length; ++i) {
                    vault.remove(creds[i]);
                }

                $('body').load('views/account/index.html');
            });
            $('#BackBtn').on('click tap', function () {
                $('body').load('views/overview/index.html');
            });

            //Handle API Token
            let ApiToken = Settings.Get('ApiToken');
            if (ApiToken)
                $('#TextBoxApiToken').val(ApiToken);
            $('#TextBoxApiToken').on('change', function (e) {
                Settings.Set('ApiToken', $('#TextBoxApiToken').val());
            });

            //Handle API Secret
            let ApiSecret = Settings.Get('ApiSecret');
            if (ApiSecret)
                $('#TextBoxApiSecret').val(ApiSecret);
            $('#TextBoxApiSecret').on('change', function (e) {
                Settings.Set('ApiSecret', $('#TextBoxApiSecret').val());
            });

            //Handle API Endpoint
            let ApiEndpoint = Settings.Get('ApiEndpoint');
            if (ApiEndpoint)
                $('#TextBoxApiEndpoint').val(ApiEndpoint);
            $('#TextBoxApiEndpoint').on('change', function (e) {
                Settings.Set('ApiEndpoint', $('#TextBoxApiEndpoint').val());
            });
        });
    }

    function toCenterView(eventArgs) {
        SystemNavigator.AppViewBackButtonVisibility = Windows.UI.Core['AppViewBackButtonVisibility'].collapsed;
        if (currentItem != 1) {
            views.trigger('to.owl.carousel', [1, 300, true]);
            eventArgs.handled = true;
        }
    }
}
