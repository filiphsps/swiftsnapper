namespace SwiftSnapper {
    export namespace Views {
        export module Settings {
            export function OnView () {
                Application.getLanguageStrings(SwiftSnapper.language, function (lang) {
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
                });
            }
        }
    }
}