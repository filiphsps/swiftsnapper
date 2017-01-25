namespace SwiftSnapper {
    export namespace Views {
        export module Account {
            export function OnView () {
                Application.getLanguageStrings(SwiftSnapper.language, function (lang) {
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
            }

            export function logIn(credential, lang) {
                WindowManager.startLoading(lang.views.account.logInView.loggingIn);
                $('#LogInView form .username').prop('disabled', true);
                $('#LogInView form .password').prop('disabled', true);

                //TODO: Actually login
                let vault = new Windows.Security.Credentials.PasswordVault();
                if (vault.retrieveAll().length == 0) {
                    vault.add(credential);
                }

                localStorage.setItem('Authorization', btoa(credential.userName + ":" + credential.password));
                localStorage.setItem('AuthToken', null);
                WindowManager.stopLoading();
                WindowManager.hideStatusBar();
                $('body').load('views/overview/index.html');
            }
        }
    }
}