module SwiftSnapper {
    export module WindowManager {
        let view = null,
            pi = null,
            theme = {
                a: 255,
                r: 52,
                g: 152,
                b: 219
            };

        export function initialize() {
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
                let statusBar = Windows.UI.ViewManagement['StatusBar'].getForCurrentView();
                statusBar.showAsync();
                statusBar.backgroundOpacity = 0;
                statusBar.backgroundColor = Windows.UI.ColorHelper.fromArgb(255, 52, 152, 219);
                statusBar.foregroundColor = Windows.UI.Colors.white;

                //Lock portrait
                Windows.Graphics.Display['DisplayInformation'].autoRotationPreferences = Windows.Graphics.Display.DisplayOrientations.portrait
            }
        }

        export function showStatusBar() {
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined') {
                let statusBar = Windows.UI.ViewManagement['StatusBar'].getForCurrentView();
                statusBar.showAsync();
            }
        }

        export function hideStatusBar() {
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined') {
                let statusBar = Windows.UI.ViewManagement['StatusBar'].getForCurrentView();
                statusBar.hideAsync();
            }
        }

        export function startLoading(message) {
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined') {
                pi = Windows.UI.ViewManagement['StatusBar'].getForCurrentView().progressIndicator;
                pi.text = message;
                pi.progressValue = null;
                pi.showAsync();
            }
        }
        export function stopLoading() {
            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined' && pi !== null) {
                pi.hideAsync();
            }
        }
    }
}