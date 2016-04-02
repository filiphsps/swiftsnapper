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

            return new Promise((resolve, reject) => {
                this.SnapchatAgent.Initialize(this.CurrentUser).then(() => {
                    resolve(this);
                }).catch((err) => {
                    reject(err);
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
            Register a new user
        */
        public Register(details: Snapchat.RegisterDetails) {
            //TODO when Casper/Snapchat API become available 
            
        }

        /*
            Log In a user
        */
        public Login(details: Snapchat.LoginDetails) {
            return new Promise((resolve, reject) => {
                reject('TODO');
            });
        }
    }
}
