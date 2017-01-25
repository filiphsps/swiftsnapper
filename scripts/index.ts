'use strict';
/// <reference path='typings/cordova/plugins/Device.d.ts' />
/// <reference path='typings/winrt/winrt.d.ts' />
/// <reference path='typings/jquery/jquery.d.ts' />
/// <reference path='typings/es6-promise/es6-promise.d.ts' />

declare let Handlebars: any;
let views;

namespace SwiftSnapper {
    export let language = Windows.System.UserProfile.GlobalizationPreferences.languages[0] || 'en-US';
    export let currentItem = null,
            SystemNavigator = null;

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
            }).fail(() => {
                $.getJSON('lang/en-US.json', function (lang) {
                    callback(lang);
                });
            });
        }

        function onDeviceReady() {
            //Handle the Cordova pause and resume events
            document.addEventListener('pause', onPause, false);
            document.addEventListener('resume', onResume, false);
            SystemNavigator = Windows.UI.Core['SystemNavigationManager'].getForCurrentView();
            SystemNavigator.addEventListener('backrequested', toCenterView);
        }

        function onPause() {
            //TODO: This application has been suspended. Save application state here.
        }

        function onResume() {
            //TODO: Resume
        }
    }

    window.onload = () => {
        Application.initialize();
        let connectionProfile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();
        if (connectionProfile != null && connectionProfile.getNetworkConnectivityLevel() == Windows.Networking.Connectivity.NetworkConnectivityLevel.internetAccess) {
            $('body').load('views/account/index.html');
        } else {
            MessageManager.alert('Please connect to the internet and start the app again', 'No internet connection', () => {
                window.close();
            });
        }
    };

    function toCenterView(eventArgs) {
        SystemNavigator.AppViewBackButtonVisibility = Windows.UI.Core['AppViewBackButtonVisibility'].collapsed;
        if (currentItem != 1) {
            views.trigger('to.owl.carousel', [1, 300, true]);
            eventArgs.handled = true;
        }
    }
}
