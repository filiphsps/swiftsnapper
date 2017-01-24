namespace SwiftSnapper {
    export namespace Views {
        export module Overview {
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
                        SwiftSnapper.currentItem = pos;
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
                        localStorage.setItem('AuthToken', res.authToken);

                        if (!snaps || snaps.length < 1)
                            return $('#SnapsView .SnapsList').append('<p class="note">' + lang.views.overview.emptyFeed + '</p>');

                        for (let n = 0; n < snaps.length; n++) {
                            let snap = snaps[n],
                                output =
                                    '<article class="item" data-id="' + snap.id + '"><div class="notify snap"><span class=";icon mdl2-checkbox-fill"></span></div><div class="details">' +
                                    '<div class="header">' + snap.sender + '</div>' +
                                    '<div class="details">Length: ' + snap.timer.toString() + '</div>' +
                                    '</div></article>';

                            $('#SnapsView .SnapsList').append(output);
                        }
                    }).catch((err) => {
                        MessageManager.alert('Error: ' + err, 'Error!', null);
                        $('#SnapsView .SnapsList').append('<p class="note">' + lang.views.overview.emptyFeed + '</p>');
                    });

                    //Temp for showing snaps
                    $('body').on('click tap', '#SnapsView .SnapsList .item', (e) => {
                        let snap = $(e.currentTarget).data('id');

                        cn.Get({
                            endpoint: 'snaps/' + snap + '/' + localStorage.getItem('AuthToken')
                        }).then((res: any) => {

                            $('#ShowSnapView').css('display', 'block');
                            $('#ShowSnapView img').attr('src', 'data:image/*;base64,' + btoa(res));
                        }).catch((err) => {
                            console.log(err);
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
        }
    }
}