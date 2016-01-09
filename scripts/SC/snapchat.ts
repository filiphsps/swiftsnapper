/// <reference path="snapchat.agent.ts" />
/// <reference path="snapchat.models.ts" />

namespace Snapchat {
    export class Client {
        private SnapchatAgent: SnapchatAgent;
        public TempData; //Temp

        public Initialize() {
            this.SnapchatAgent = new SnapchatAgent();

            return new Promise((resolve) => {
                this.SnapchatAgent.Initialize().then(function () {
                    resolve(this);
                });
            });
        }

        //Temp
        public GetPendingFeed(): Array<Snapchat.Snap> {
            let Snaps: Array<Snapchat.Snap> = [],
                snaps = this.TempData.conversations_response[0].pending_received_snaps;
            
            for (var n = 0; n < snaps.length; n++) {
                let snap = snaps[n],
                    sn = new Snapchat.Snap();
                sn.sender = snap.sn;
                sn.timer = snap.timer;

                Snaps.push(sn);
            }
            return Snaps;
        }

        public Login(details: Snapchat.LoginDetails) {
            return new Promise((resolve) => {
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
                    self.SnapchatAgent.SNAPCHAT_CLIENT_AUTH_TOKEN = data.headers['X-Snapchat-Client-Auth-Token'];
                    self.SnapchatAgent.SNAPCHAT_CLIENT_TOKEN = data.headers['X-Snapchat-Client-Token'];
                    self.SnapchatAgent.SNAPCHAT_UUID = data.headers['X-Snapchat-UUID'];

                    headers = data.headers;
                    self.SnapchatAgent.PostSnapchat('/loq/login', [
                        ['height', data.params.height],
                        ['ny', data.params.nt],
                        ['password', data.params.password],
                        ['remember_device', data.params.remember_device],
                        ['req_token', data.params.req_token],
                        ['screen_height_in', data.params.height_width_px],
                        ['screen_height_px', data.params.height_width_px],
                        ['screen_width_in', data.params.screen_width_in],
                        ['screen_width_px', data.params.screen_width_px],
                        ['timestamp', data.params.timestamp],
                        ['user_ad_id', data.params.user_ad_id],
                        ['username', data.params.username],
                        ['width', data.params.width],
                    ], headers).then(function (data) {

                        //TODO: Handle data
                        self.TempData = JSON.parse(data);
                        resolve(JSON.parse(data));
                    });
                });
            });
        }
    }
}