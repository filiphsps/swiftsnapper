namespace SwiftSnapper {
    export module MessageManager {
        let popup;

        export function initialize() {
            popup = Windows.UI.Popups;
        }

        export function alert(message: string, title: string, callback?) {
            let alert = new popup.MessageDialog(message, title);
            alert.commands.append(new popup.UICommand("OK", function (cmd) {
                if(callback)
                    callback();
            }));
            alert.defaultCommandIndex = 1;
            alert.showAsync();
        }

        export function alertWithOptions(message: string, title: string, commands: Array<string>, index: number, callback: Function) {
            let alert = new popup.MessageDialog(message, title),
                cb = function (cmd) {
                    callback(cmd.label);
                };

            for (let n; n < commands.length; n++) {
                alert.commands.append(new popup.UICommand(commands[n], cb));
            }
            
            alert.defaultCommandIndex = index;
            alert.showAsync();
        }
    }
}