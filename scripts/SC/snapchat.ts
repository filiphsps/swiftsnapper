/// <reference path="snapchat.agent.ts" />
/// <reference path="snapchat.models.ts" />

namespace Snapchat {
    export class Client {
        private SnapchatAgent: Snapchat.Agent;

        public AllUpdatesData;
        public CurrentUser: Snapchat.User;

        public Initialize() {
            this.SnapchatAgent = new Snapchat.Agent();
            this.CurrentUser = new Snapchat.User();

            return new Promise((resolve) => {
                this.SnapchatAgent.Initialize(this.CurrentUser).then(function () {
                    resolve(this);
                });
            });
        }

        /*
            Get the current user's pending Snapchat feed
        */
        public GetPendingFeed(): Array<Snapchat.Snap> {
            let Snaps: Array<Snapchat.Snap> = [];
            if (this.AllUpdatesData != undefined) {
                let friends = this.AllUpdatesData.conversations_response;

                for (var x = 0; x < friends.length; x++) {
                    const snaps = friends[x].pending_received_snaps;
                    for (var n = 0; n < snaps.length; n++) {
                        let snap = snaps[n],
                            sn = new Snapchat.Snap();

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
            else
            {
                return Snaps;
            }
        }

        /*
            Get the media for the provided snap
        */
        public GetSnapMedia(snap: Snapchat.Snap) {
            let self = this,
                data = this.AllUpdatesData,
                timestamp = this.SnapchatAgent.GenerateTimeStamp();

            return new Promise((resolve) => {
                self.SnapchatAgent.GetSnapchatAuthFromCasper('/ph/blob', timestamp).then(function (d: string) {
                    let cData = JSON.parse(d);
                    for (var n = 0; n < cData.endpoints.length; n++)
                        if (cData.endpoints[n].endpoint == '/ph/blob') {
                            cData = cData.endpoints[n];
                            break;
                        }

                    let headers = {
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
                    ], headers).then(
                        function (data) {
                            resolve(data);
                        });
                });
            });
        }

        /*
            Get a user's SnapTag
            Doesn't work yet.
        */
        public GetSnapTag(username: string) {
            let self = this,
                data = this.AllUpdatesData,
                timestamp = this.SnapchatAgent.GenerateTimeStamp(),
                req_token = this.SnapchatAgent.GenerateRequestToken(this.SnapchatAgent.SNAPCHAT_AUTH_TOKEN, timestamp);

            return new Promise((resolve) => {
                let headers = {
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
                ], headers).then(
                    function (data) {
                        resolve(data);
                    });
            });
        }

        public PostSnap(URI, parameters, headers?) {
            return this.SnapchatAgent.PostSnapchat(URI, parameters, headers);
        }

        /*
            Log In a user
        */
        public Login(details: Snapchat.LoginDetails) {
            return new Promise((resolve) => {
                if (details.username.length < 1 || details.password.length < 1) {
                    resolve({ 'code': -1, 'message': 'You must provide both username AND password!' });
                    return;
                }

                let headers = {
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'gzip',
                    'User-Agent': this.SnapchatAgent.CASPER_USER_AGENT,
                };
                let timestamp = this.SnapchatAgent.GenerateTimeStamp(),
                    self = this;

                this.SnapchatAgent.PostCasper('/snapchat/auth', [
                    ['username', details.username],
                    ['password', details.password],
                    ['snapchat_version', this.SnapchatAgent.SNAPCHAT_VERSION],
                    ['timestamp', timestamp.toString()],
                    ['token', this.SnapchatAgent.CASPER_API_TOKEN],
                    ['token_hash', this.SnapchatAgent.GenerateCasperTokenHash(timestamp)]
                ], headers).then(function (snapchatData) {
                    var data = JSON.parse(snapchatData);
                    if (data.code !== 200) {
                        resolve(data); //TODO
                        return;
                    }

                    self.SnapchatAgent.SNAPCHAT_CLIENT_AUTH_TOKEN = data.headers['X-Snapchat-Client-Auth-Token'];
                    self.SnapchatAgent.SNAPCHAT_CLIENT_TOKEN = data.headers['X-Snapchat-Client-Token'];
                    self.SnapchatAgent.SNAPCHAT_UUID = data.headers['X-Snapchat-UUID'];
                    self.SnapchatAgent.SNAPCHAT_USER_AGENT = data.headers['User-Agent'];

                    headers = data.headers;
                    headers['X-Snapchat-Client-Token'] = self.SnapchatAgent.SNAPCHAT_CLIENT_TOKEN;
                    self.SnapchatAgent.PostSnapchat('/loq/login', [
                        ['height', data.params.height],
                        ['ny', data.params.nt],
                        ['password', data.params.password],
                        ['remember_device', data.params.remember_device],
                        ['req_token', data.params.req_token],
                        ['screen_height_in', data.params.screen_height_in],
                        ['screen_height_px', data.params.screen_height_px],
                        ['screen_width_in', data.params.screen_width_in],
                        ['screen_width_px', data.params.screen_width_px],
                        ['timestamp', data.params.timestamp],
                        ['user_ad_id', data.params.user_ad_id],
                        ['username', data.params.username],
                        ['width', data.params.width],
                    ], headers).then(function (data) {
                        self.AllUpdatesData = JSON.parse(data);

                        if (typeof self.AllUpdatesData['status'] !== 'undefined' && self.AllUpdatesData['status'] !== 200) {
                            resolve({ 'status': self.AllUpdatesData['status'], 'message': self.AllUpdatesData['message'] });
                            return;
                        }

                        self.SnapchatAgent.SNAPCHAT_AUTH_TOKEN = self.AllUpdatesData.updates_response.auth_token;
                        self.CurrentUser.username = details.username;
                        self.CurrentUser.password = details.password;
                        self.CurrentUser.google_username = null;
                        self.CurrentUser.google_password = null;
                        resolve(JSON.parse(data));
                    });
                });
            });
        }
    }
}
